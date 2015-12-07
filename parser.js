'use strict';

function parse(expr) {
  var lexer = new Lexer();
  var parser = new Parser(lexer);
  return parser.parse(expr);
}

function Lexer() {}

Lexer.prototype.lex = function(text) {
  this.text = text;
  this.index = 0;
  this.ch = undefined;
  this.token = [];

  while(this.index < this.text.length) {
    this.ch = this.text.charAt(this.index);
    if (this.isNumber(this.ch)) {
      this.readNumber();
    }
  }
};

Lexer.prototype.isNumber = function(raw) {
  return !isNaN(Number(String(raw)));
};

Lexer.prototype.readNumber = function() {
  var number = '';

  // TODO: 嵌套 while 暴露索引，这个设计模式太烂了
  while(this.index < this.text.length) {
    this.index++;
  }
};

function Parser() {}

Parser.prototype.parse = function() {};

