git-http-server
===============

serve a directory of git repositories over http

this tool is basically a thin command line wrapper around
https://github.com/substack/git-http-backend

Example
-------

Start the server with one repository

    $ cd repos/
    $ git init --bare foo.git
    Initialized empty Git repository in /Users/dave/dev/node-git-http-server/repos/foo.git/
    $ git-http-server
    listening on http://0.0.0.0:8174 in /Users/dave/dev/node-git-http-server/repos

Now, clone the empty repository

    $ git clone http://127.0.0.1:8174/foo.git
    Cloning into 'foo'...
    warning: You appear to have cloned an empty repository.
    Checking connectivity... done.
    $ cd foo

Add some files and push them back

    $ touch bar
    $ git add bar
    $ git commit -m 'initial commit' bar
    [master (root-commit) 9a37778] initial commit
    1 file changed, 0 insertions(+), 0 deletions(-)
    create mode 100644 bar
    $ git push origin master
    Counting objects: 3, done.
    Writing objects: 100% (3/3), 204 bytes | 0 bytes/s, done.
    Total 3 (delta 0), reused 0 (delta 0)
    To http://127.0.0.1:8174/foo.git
    * [new branch]      master -> master

Meanwhile, the logs look like

    127.0.0.1 - - [28/Mar/2015:22:45:51 -0400] "GET /foo.git/info/refs?service=git-upload-pack HTTP/1.1" 200 - "-" "git/1.9.5 (Apple Git-50.3)"
    127.0.0.1 - - [28/Mar/2015:22:46:44 -0400] "GET /foo.git/info/refs?service=git-receive-pack HTTP/1.1" 200 - "-" "git/1.9.5 (Apple Git-50.3)"
    127.0.0.1 - - [28/Mar/2015:22:46:44 -0400] "POST /foo.git/git-receive-pack HTTP/1.1" 200 - "-" "git/1.9.5 (Apple Git-50.3)"

Install
-------

    [sudo] npm install -g git-http-server

Usage
-----

    usage: git-http-server [-r] [-p port] [-H host] [dir]

    options

      -h, --help               print this message and exit
      -H, --host <host>        [env GIT_HTTP_HOST] host on which to listen
      -p, --port <port>        [env GIT_HTTP_PORT] port on which to listen
      -r, --readonly           [env GIT_HTTP_READONLY] operate in read-only mode
      -u, --updates            check for available updates
      -v, --version            print the version number and exit

License
-------

MIT License
