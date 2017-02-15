var http = require('https');
var path = require('path');
var fs = require('fs-extra');
var Promise = require('bluebird');
var cheerio = require('cheerio');
var config = require('../config.js');




function fetchPage(argv_path) {
  this.path = argv_path;

  this.dir_files = [];
}
fetchPage.prototype = {
  init: function() {
    var me = this;

    me.read_dir()
      .then(function(arr) {
        me.dir_files = arr;
        console.log(arr);
        me.get_gitpages()
      })

  },

  // 读取当前目录下的文件信息
  read_dir: function() {
    /* body... */
    var me = this;
    return new Promise(function(resolve, reject) {

      fs.readdir(path.join(me.path), function(err, flis) {
        if (err) {
          reject(err)
        }
        console.log('读取指定目录成功--')
        resolve(flis);
      })
    });
  },
  // 获取git仓储的数据
  get_gitpages: function() {
    /* body... */
    var me = this;
    return new Promise(function(resolve, reject) {
      http.get(config.url, function(res) {
        var html = ''; //用来存储请求网页的整个html内容
        res.setEncoding('utf-8'); //防止中文乱码

        res.on('data', function(chunk) {
          html += chunk;
        });

        res.on('end', function() {
          var $ = cheerio.load(html); //采用cheerio模块解析html
          var urls = $('div.js-repo-list>li');
          console.log('github库存信息读取成功--')

          var falg = null;
          for (var i = 0; i < urls.length; i++) {
            // 文件名
            var name = $(urls[i]).find('div.d-inline-block a').text().trim();

            // 信息
            var title = $(urls[i]).find('p.d-inline-block').text().trim();
            var tags = $(urls[i]).find('div.text-gray span.mr-3').text().trim();
            var time = $(urls[i]).find('div.text-gray relative-time').attr('datetime');
            time = me.handle_time(time);
            var info = '---' + '\n' +
              'title: ' + title + '\n' +
              'tags: ' + tags + '\n' +
              'date: ' + time + '\n' +
              '---' + '\n' +
              '[点击阅读](https://zc3hd.github.io/' + name + ')';

            // 前面是demo的才进行处理
            if (name.substr(0, 4) == 'demo') {
              falg = me.dir_files.indexOf(name+'.md');
              me.indexOfDir(falg, { name: name, info: info });
            }
          }

        });

      }).on('error', function(err) {
        reject(err);
      });
    });
  },
  // indexOfDir判断是否在文件夹中的处理
  indexOfDir: function(flag, obj) {
    /* body... */
    var me = this;
    // 文件不存在
    if (flag == -1) {
      fs.writeFileSync(path.join(me.path, obj.name + '.md'), obj.info, 'utf-8');
      console.log(obj.name + '.md--已生成--');
    }
    // 文件存在的情况下
    else {
      console.log(obj.name + '.md*******已存在*****');
    }
  },
  // 返回时间的处理
  handle_time: function(time) {
    /* body... */
    var me = this;
    var str = time.split('T')[0];

    return str.split('-').join('/');
  },
};

module.exports = function(argv_path) {
  /* body... */
  return new fetchPage(argv_path).init();
}
