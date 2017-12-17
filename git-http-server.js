#!/usr/bin/env node
/**
 * fire up an HTTP server to serve git repositories
 *
 * Author: Dave Eddy <dave@daveeddy.com>
 * Date: March 28, 2015
 * License: MIT
 */

var http = require('http');
var spawn = require('child_process').spawn;
var path = require('path');
var url = require('url');

var accesslog = require('access-log');
var backend = require('git-http-backend');
var getopt = require('posix-getopt');

var package = require('./package.json');

var usage = [
  'usage: git-http-server [-r] [-p port] [-H host] [dir]',
  '',
  'options',
  '',
  '  -h, --help               print this message and exit',
  '  -H, --host <host>        [env GIT_HTTP_HOST] host on which to listen',
  '  -p, --port <port>        [env GIT_HTTP_PORT] port on which to listen',
  '  -r, --readonly           [env GIT_HTTP_READONLY] operate in read-only mode',
  '  -u, --updates            check for available updates',
  '  -v, --version            print the version number and exit',
].join('\n');

var options = [
  'h(help)',
  'H:(host)',
  'p:(port)',
  'r(readonly)',
  'u(updates)',
  'v(version)'
].join('');
var parser = new getopt.BasicParser(options, process.argv);

var opts = {
  host: process.env.GIT_HTTP_HOST || '0.0.0.0',
  port: process.env.GIT_HTTP_PORT || 8174,
  readonly: process.env.GIT_HTTP_READONLY,
};
var option;
while ((option = parser.getopt())) {
  switch (option.option) {
    case 'h': console.log(usage); process.exit(0); break;
    case 'H': opts.host = option.optarg; break;
    case 'p': opts.port = option.optarg; break;
    case 'r': opts.readonly = true; break;
    case 'u': // check for updates
      require('latest').checkupdate(package, function(ret, msg) {
        console.log(msg);
        process.exit(ret);
      });
      return;
    case 'v': console.log(package.version); process.exit(0); break;
    default: console.error(usage); process.exit(1); break;
  }
}
var args = process.argv.slice(parser.optind());
var dir = args[0];

if (dir)
  process.chdir(dir);

http.createServer(onrequest).listen(opts.port, opts.host, started);

function started() {
  console.log('listening on http://%s:%d in %s', opts.host, opts.port, process.cwd());
}

function onrequest(req, res) {
  accesslog(req, res);

  // ensure the user isn't trying to send up a bad request
  var u = url.parse(req.url);
  if (u.pathname !== path.normalize(u.pathname)) {
    res.statusCode = 400;
    res.end();
    return;
  }

  var repo = /\/(.*)\/(HEAD|info\/refs|git-[^/]+|objects\/(info\/[^/]+|[0-9a-f]{2}\/[0-9a-f]{38}|pack\/pack-[0-9a-f]{40}\.(pack|idx)))$/.exec(u.pathname)[1];

  req.pipe(backend(req.url, function(err, service) {
    if (err) {
      res.statusCode = 500;
      res.end(err + '\n');
      return;
    }

    res.setHeader('content-type', service.type);

    if (opts.readonly && service.cmd !== 'git-upload-pack') {
      res.statusCode = 403;
      res.end('server running in read-only mode\n');
      return;
    }

    var ps = spawn(service.cmd, service.args.concat(repo));
    ps.stdout.pipe(service.createStream()).pipe(ps.stdin);
  })).pipe(res);
}
