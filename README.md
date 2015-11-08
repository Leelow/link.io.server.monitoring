!["Link.IO Monitoring server"](https://cdn.rawgit.com/Leelow/link.io.server.monitoring/master/logo.png)

#### Installation

You have to install nodejs dependencies. To do this, open a console in the project directory and execute

> npm install

Then you have to edit *settings.json* to configure server and client side at the same time. You can imitate this example :

```javascript
{
  "link_io_server_monitoring" : {
      "port"   : 8081,
      "url"    : "localhost:8081"
  },
  "logs_link_io_server" : {
      "script" : "F:\\dev-github\\link.io.server\\server.js",
      "url"    : "http://localhost:8080"
  }
}
```

# Web interface

More information coming soon ...

# Link.io.server

You can find more information about the the Link.IO API server [here](https://github.com/Chaniro/link.io.server/).

# TO-DO

Rethink socket management and add a login.
