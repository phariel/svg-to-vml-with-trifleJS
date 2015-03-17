/*SIE-SVG without Plugin under LGPL2.1 & GPL2.0 & Mozilla Public License
 *http://sie.sourceforge.jp/
 *Usage: <script defer="defer" type="text/javascript" src="sie.js"></script>
 */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Mozilla SVG Cairo Renderer project.
 *
 * The Initial Developer of the Original Code is IBM Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Parts of this file contain code derived from the following files(s)
 * of the Mozilla SVG project (these parts are Copyright (C) by their
 * respective copyright-holders):
 *    layout/svg/renderer/src/libart/nsSVGLibartBPathBuilder.cpp
 *
 * Contributor(s):DHRNAME revulo bellbind
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
/*
 * Copyright (c) 2000 World Wide Web Consortium,
 * (Massachusetts Institute of Technology, Institut National de
 * Recherche en Informatique et en Automatique, Keio University). All
 * Rights Reserved. This program is distributed under the W3C's Software
 * Intellectual Property License. This program is distributed in the
 * hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE.
 * See W3C License http://www.w3.org/Consortium/Legal/ for more details.
 *//*!MIT License
See Also MIT-LICENSE.txt
Copyright (c) 2013 dhrname*/


(function(){

/*本体オブジェクト。base関数の裏に隠蔽されている*/
var _base = {
    
    /*_base.Fはbase関数で使うコンストラクタ関数*/
    F: function() {},
    
    /*_base.objはbase関数やupメソッドで呼び出されるオブジェクトの始祖となるオブジェクト*/
    obj: {
      /*upメソッド
       * 自身をプロトタイプとして、新たにオブジェクトを生成する
       */
      up: function(name) {
        var F = _base.F,
             s;
        F.prototype = this;
        s = new F();
        if (name) {
          this[name] = s;
          s.up = this.up;
        } else {
          /*既定値を$1としておく*/
          this.$1 = s;
        }
        F = void 0;
        return s;
      },
    
      /*mixメソッド
       * 別のオブジェクトと合成ができるメソッド
       */
      mix: function(obj) {
        if (!obj) {
          throw new Error("No arguments error");
        }
        if (typeof obj !== "function") {
          var alias = _base.__ng_;
          for (var i in obj) {
            if (!alias[i]) {
              /*hasOwnPropertyメソッドを使わないのは、プロトタイプチェーンをたどるようにするため
               *なお、Object.prototypeのプロパティなどは外した方がエラーがおきにくい
               */
              this[i] = obj[i];
            }
          }
          i = alias = void 0;
        } else {
          obj.call(this, this);
        }
        return this;
      },
    
      /*onメソッド
       * メソッドの合成ができるメソッド。
       * 指定した名前nameのメソッドが呼び出された場合、便乗して指定関数funcをメソッドとして実行することができる
       */
      on: function(name, func) {
        if (!name) {
          throw new Error("No arguments error");
        } else if (/^(?:up|on|mix)$/.test(name)) {
          throw new Error("Invalid method name error");
        } else if (typeof func !== "function") {
          throw new Error("Not support arguments type");
        }
        var tev = this._eventList__,
            tn = this[name];
        if (!this._eventList__) {
          tev = this._eventList__ = [];
        } else if (!this.hasOwnProperty("_eventList__")) { //祖先がすでにonメソッドを呼び出していれば
          var s = [];
          s._parent = tev;
          tev = this._eventList__ = s;
          s = void 0;
        }
        if (!this[name] || !tn.isOn) { //まだ、onメソッドが呼び出されていなければ
          /*nameで指定されたメソッドの初期化*/
          if (typeof tn === "function") {
            /*nameで指定されたメソッドがすでにある場合は、配列tevの親をたどれないようにしておく*/
            tev.push({
                name: name,
                func: tn
              });
            tev._parent = null;
          }
          this[name] = function() {
            var te = this._eventList__,
                 _name = name,    //スコープチェーンのエイリアス
                 ts = null,
                 s = null,
                 isCalled = false;//返り値の制御で使う
            te._child = null;
            while (te._parent) { //親をさかのぼっていく
              te._parent._child = te;
              te = te._parent;
            }
            while (te) {            //子をたどっていく
              /*最初の返り値の結果はsとして記録して、後で返す*/
              for (var i=0, tli=te.length;i<tli;++i) {
                if(te[i].name === _name) {
                  ts = te[i].func.apply(this, arguments);
                  if (!isCalled) {
                    s = ts;
                    isCalled = true;
                  }
                }
              }
              te = te._child;
            }
            te = ts = _name = isCalled = void 0;
            return s;
          };
          this[name].isOn = true;
        }
        tev.push({
                name: name,
                func: func
              });
        tev = tn = func= void 0;
        return this;
      }
    }
};

/*base関数でキャッシュとして使うオブジェクト*/
var baseCache = {};

base = function (name) {
    var __base = _base,
         _cache = baseCache; //エイリアス作成
    if (!name) {
      throw new Error("No arguments error");
    } else if (_cache[name]) {
      /*キャッシュに登録されている場合は、登録されたオブジェクトを返す*/
      return _cache[name];
    } else {
      var F = __base.F,
           s;
      F.prototype = __base.obj;
      s = new F();
      this[name] = _cache[name] = s;
      /*自身が値であるようなプロパティを設定する*/
      s[name] = s;
      F = void 0;
      return s;
    }
};


/*mixメソッドで使うNGハッシュを作成*/
var hash = {},
    proto = Object.prototype;
for (var i in proto) {
  hash[i] = true;
  /*上記のキャッシュについて、すべてのプロパティをnullかundefinedにしておく*/
  baseCache[i] = null;
}
hash.constructor = false; //constructorはNGハッシュに追加しない
_base.__ng_ = hash;
hash = proto = void 0;

/*base.free関数
 *  即時関数の内部で作っていおいたオブジェクトを解放させるための関数
 */
base.free = function() {
  delete _base.obj;
  _base = baseCache = void 0;
};

})();

/*Function Object.create
 *関数Object.createはオブジェクトを新規に作り出すときに使う。
 *SIEでスーパークラスに引数が指定されているときの対策として使う。
 *example: function SuperClass (ng) {ng.e();};
 *function SubClass () {};
 *SubClass.prototype = new SuperClass(); // Error
 *SubClass.prototype = Object.create(SuperClass) // OK*/
if (!Object._create) {
  Object._create = function (/*Function*/ cl) {
    var s = function () {};
    s.prototype = cl.prototype;
    cl = void 0;
    return new s();
  };
}
// File: http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/dom.idl
/*W3CのDOMのIDLを参照にコードを起こしている
 *変数やプロパティ、メソッドの名前の頭に、「_」がついているときはSIE独自のもの
 */
/*
#ifndef _DOM_IDL_
#define _DOM_IDL_

#pragma prefix "w3c.org"
module dom
{

  valuetype DOMString sequence<unsigned short>;

  typedef   unsigned long long DOMTimeStamp;

  interface DocumentType;
  interface Document;
  interface NodeList;
  interface NamedNodeMap;
  interface Element;
*/
function DOMException(n){
 Error.apply(this, arguments);
 this.code = n;
 var s = [
   "", //数合わせのため
   "Index Size Error",
   "DOMString Size Error",
   "Hierarchy Request Error",
   "Wrong　Document　Error",
   "Invalid　Character　Error",
   "No Data Allowed　Error",
   "No Modification Allowed Error",
   "Not Found Error",
   "Not Supported　Error",
   "Inuse　Attribute　Error",
   "Invalid State　Error",
   "Syntax Error",
   "Invalid Modification　Error",
   "Namespace Error",
   "Invalid Access Error"
 ];
 this.message = s[n];
/*DOMSTRING_SIZE_ERR
テキストの指定された範囲がDOMStringに合致しない。 2
HIERARCHY_REQUEST_ERR
コードが属さない場所に挿入されている。 3
INDEX_SIZE_ERR
インデクス若しくは大きさが負数，又は許された値よりも大きい。 1
INUSE_ATTRIBUTE_ERR
他で既に使用されている属性を追加しようとしている。 10
INVALID_ACCESS_ERR，DOM水準2で導入
パラメタ又は操作が基礎になるオブジェクトによってサポートされていない。 15
INVALID_CHARACTER_ERR
名前の中などで，妥当でない又は不正な文字が指定されている。文法に合った文字の定義についてはXML規定の 生成規則2 を，文法に合った名前文字については 生成規則5 を参照すること。5
INVALID_MODIFICATION_ERR，DOM水準2で導入
基礎となるオブジェクトの型を修正しようとしている。 13
INVALID_STATE_ERR，DOM水準2で導入
利用不可能又はもはや利用可能ではないオブジェクトを使用しようとしている。 11
NAMESPACE_ERR，DOM水準2で導入
名前空間に関して正しくない方法でオブジェクトを生成又は変更しようとしている。 14
NOT_FOUND_ERR
ノードが存在しない文脈でそのノードを参照しようとしている。 8
NOT_SUPPORTED_ERR
実装は，オブジェクト又は操作の要求された型をサポートしていない。9
NO_DATA_ALLOWED_ERR
データをサポートしないノードに対してデータを指定している。 6
NO_MODIFICATION_ALLOWED_ERR
修正が許されない場所でオブジェクトを修正しようとしている。 7
SYNTAX_ERR，DOM水準2で導入
妥当ではない又は不正な文字列が指定されている。 12
WRONG_DOCUMENT_ERR
ノードを生成した文書以外の(そのノードをサポートしない)異なる文書で，ノードが使用されている。4
*/
};
(function(t) {
/*マジックナンバーは軽量化のため原則コメントで記述するのみ
t.INDEX_SIZE_ERR                 = 1;
t.DOMSTRING_SIZE_ERR             = 2;
t.HIERARCHY_REQUEST_ERR          = 3;
t.WRONG_DOCUMENT_ERR             = 4;
t.INVALID_CHARACTER_ERR          = 5;
t.NO_DATA_ALLOWED_ERR            = 6;
t.NO_MODIFICATION_ALLOWED_ERR    = 7;
t.NOT_FOUND_ERR                  = 8;
t.NOT_SUPPORTED_ERR              = 9;
t.INUSE_ATTRIBUTE_ERR            = 10;
t.INVALID_STATE_ERR              = 11;
t.SYNTAX_ERR                     = 12;
t.INVALID_MODIFICATION_ERR       = 13;
t.NAMESPACE_ERR                  = 14;
t.INVALID_ACCESS_ERR             = 15;*/
t.prototype = new Error();
})(DOMException);

/*DOMImplementation
 *DOMの基本的な機能をつかさどる
 */
base("DOMImplementation").mix( {
    /* hasFeature
     *文字列によって、機能をサポートしているかどうかをチェックする。削除不可。
     */
    /*boolean*/ hasFeature : function(/*string*/ feature, version) {
      switch (feature) {
        case "CORE" :
        case "XML" :
        case "Events" :              //DOM level2 Eventを参照
        case "StyleSheets" :         //DOM level2 StyleSheetを参照
        case "org.w3c.svg.static" :  //SVG1.1の仕様を参照
        case "org.w3c.dom.svg.static" :
          return true;
        default :
          if (version === "2.0") {   //DOM level2 Coreにおいて策定されたバージョン情報
            return true;
          } else {
            return false;
          }
      }
    },

    /* createDocumentType
     *ドキュメントタイプを作るためのもの。DTDは<!DOCTYPE[ ]>で表現されうる。
     */
    /*DocumentType*/ createDocumentType : function(/*string*/ qualifiedName, publicId, systemId) {
      var s = base("$document").up();
      s.name = "";
      s.entities = new NamedNodeMap();   //パラメタ実体を除く実体の集まり
      s.notations = new NamedNodeMap(); //DTDで示した記法の集まり
      s.publicId = publicId;                //外部サブセットの公開識別子
      s.systemId = systemId;                //上同のシステム識別子
      s.internalSubset = "";                 //内部サブセットの内容（文字列）
      s.nodeValue = null;
      s.nodeType = /*Node.DOCUMENT_TYPE_NODE*/ 10;
      return s;
    },
    /* createDocument
     * ドキュメントオブジェクトを作るためのもの。削除不可。
     */
    /*Document*/ createDocument : function( /*string*/ ns, qname, /*DocumentType*/ doctype) {
      try {
        var s = base("$document").up();
        this._doc_ && (s._document_ = this._doc_);          //_document_プロパティはcreateElementNSメソッドやradialGradient要素やNAIBU._setPaintなどで使う
        s.implementation = this;
        s.doctype = doctype || null;
        s._id = {};  //getElementByIdで使う
        s._capter = [];
        s.documentElement = s.createElementNS(ns, qname); //ルート要素を作る
        s.childNodes = [];
        return s;
      } catch(e){}
    },
    "http://www.w3.org/2000/xmlns": {}
} );

/* Node
 *ノード（節）はすべての雛形となる重要なものである。削除不可。
 */

/*軽量化のためにマジックナンバーはコメントで代替
 *(function(t) {
// NodeType
/*const unsigned short  t.ELEMENT_NODE                   = 1;
/*const unsigned short  t.ATTRIBUTE_NODE                 = 2;
/*const unsigned short  t.TEXT_NODE                      = 3;
/*const unsigned short  t.CDATA_SECTION_NODE             = 4;
/*const unsigned short  t.ENTITY_REFERENCE_NODE          = 5;
/*const unsigned short  t.ENTITY_NODE                    = 6;
/*const unsigned short  t.PROCESSING_INSTRUCTION_NODE    = 7;
/*const unsigned short  t.COMMENT_NODE                   = 8;
/*const unsigned short  t.DOCUMENT_NODE                  = 9;
/*const unsigned short  t.DOCUMENT_TYPE_NODE             = 10;
/*const unsigned short  t.DOCUMENT_FRAGMENT_NODE         = 11;
/*const unsigned short  t.NOTATION_NODE                  = 12;
})(Node);*/
base("$document").mix( {
  //以下は初期値として設定
  tar : null,
  firstChild : null,
  previousSibling : null,
  nextSibling : null,
  attributes : null,
  namespaceURI : null,
  localName : null,
  lastChild : null,
  prefix : null,
  ownerDocument : base("$document"), //自分自身のオブジェクトを指定
  parentNode : null,
  nodeName : "#document",
  nodeValue : null,
  nodeType : /*Node.DOCUMENT_NODE*/ 9,
  childNodes : [],

/*insertBeforeメソッド
 *指定したrefノードの前に、新たなnノードを入れる。貼り付け（ペースト）機能。
 */
/*Node*/ insertBefore : function( /*Node*/ n, ref) {
  var tp = this.parentNode,
      rp, evt,
      te = this,
      j = 0,
      t,
      s, descend, di;
  while (tp) {                               //先祖をたどっていく
    if (tp === n) {                          //先祖要素が追加ノードならばエラー
      throw new DOMException(/*DOMException.HIERARCHY_REQUEST_ERR*/ 3);
    }
    tp = tp.parentNode;
  }
  if (this.ownerDocument !== n.ownerDocument) { //所属Documentの生成元が違うならば
    throw new DOMException(/*DOMException.WRONG_DOCUMENT_ERR*/ 4);
  }
  if (n.parentNode) {                  //親要素があれば
    n.parentNode.removeChild(n);
  }
  if (!ref) {
    /*参照要素がNULLの場合、要素を追加する(appendChildと同じ効果）*/
    if (!this.firstChild) {
      this.firstChild = n;
    }
    if (this.lastChild) {
      n.previousSibling = this.lastChild;
      this.lastChild.nextSibling = n;
    }
    this.lastChild = n;
    this.childNodes.push(n);
    n.nextSibling = null;
  } else {
    if (ref.parentNode !== this) {              //参照ノードが子要素でない場合
      throw new DOMException(/*DOMException.NOT_FOUND_ERR*/ 8);
    }
    t = this.firstChild;
    if (t === ref) {
      this.firstChild = n;
    }
    while (t) {
      if (t === ref) {
        this.childNodes.splice(j, 1, n, ref);   //Arrayのspliceを利用して、リストにnノードを追加
        break;
      }
      ++j;
      t = t.nextSibling;
    }
    rp = ref.previousSibling;
    if (rp) {
      rp.nextSibling = n;
    }
    ref.previousSibling = n;
    n.previousSibling = rp;
    n.nextSibling = ref;
  }
  n.parentNode = this;
  if ((n.nodeType===/*Node.ENTITY_REFERENCE_NODE*/ 5) || (n.nodeType===/*Node.DOCUMENT_FRAGMENT_NODE*/ 11)) {
    /*実体参照や、文書フラグメントノードだけは子ノードを検索して、
     *それらを直接文書に埋め込む作業を以下で行う
     */
    var ch = n.childNodes.concat([]); //Arrayのコピー
    for (var i=0,chli=ch.length;i<chli;i++) {
      this.insertBefore(ch[i], n);
    }
    ch = void 0;
  }
  tp = rp = evt = te =j = t = s = descend = di = void 0;
  return n;
},
/*replaceChildメソッド
 *指定したoldChildノードの代わりに、新たなnewChildノードを入れる。切り替え機能。
 */
/*Node*/ replaceChild : function( /*Node*/ newChild, oldChild) {
  this.insertBefore(newChild, oldChild);
  return this.removeChild(oldChild);
},
/*removeChildメソッド
 *eleノードをリストから取り除く。eleノードそのものは削除されない。切り取り（カット）機能。
 */
/*Node*/ removeChild : function( /*Node*/ ele) {
  if (ele.parentNode !== this) {                                        //親が違う場合
    throw new DOMException(/*DOMException.NOT_FOUND_ERR*/ 8);
  }
  if (ele.ownerDocument !== this.ownerDocument) { //所属ドキュメントが違う場合
    throw new Error();
  }
  ele.parentNode = null;
  var t = this.firstChild,
      j = 0;
  while (t) {
    if (t === ele) {
      this.childNodes.splice(j, 1);      //Arrayのspliceを利用して、リストからeleノードを排除
      break;
    }
    ++j;
    t = t.nextSibling;
  }
  if (this.firstChild === ele) {
    this.firstChild = ele.nextSibling;
  }
  if (this.lastChild === ele) {
    this.lastChild = ele.previousSibling;
  }
  ele.previousSibling && (ele.previousSibling.nextSibling = ele.nextSibling);
  ele.nextSibling && (ele.nextSibling.previousSibling = ele.previousSibling);
  ele.nextSibling = ele.previousSibling = null;
  t = j = void 0;
  return ele;
},
/*appendChildメソッド
 *eleノードをリストの最後尾に追加する
 */
/*Node*/ appendChild : function( /*Node*/ ele) {
  return this.insertBefore(ele, null);
},
/*hasChildNodesメソッド
 *子ノードがあるかどうか
 */
/*boolean*/ hasChildNodes : function() {
  return (this.childNodes.length > 0);
},
/*cloneNodeメソッド
 *ノードのコピーを作る。引数は、子ノードのコピーも作るかどうか。コピー機能。
 */
/*Node*/ cloneNode : function( /*boolean*/ deep) {
  return this.ownerDocument.importNode(this, deep);
},
/*normalizeメソッド
 *二つ以上の重複したテキストノードを一つにまとめる
 */
/*void*/ normalize : function() {
  var tcn = this.childNodes;
  try {
  for (var i=tcn.length-1;i<0;--i) {
    var tcni = tcn[i], tcnip = tcni.nextSibling;
    if (tcnip) {
      if (tcni.nodeType === /*Node.TEXT_NODE*/ 3 && tcnip.nodeType === /*Node.TEXT_NODE*/ 3) {
        tcni.appendData(tcnip.data);    //次ノードの文字列データを、現ノード文字列の後に付け加える
        tcni.legnth = tcni.data.length;
        this.removeChild(tcnip);        //次ノードを排除
      } else {
        tcni.normalize();
      }
    } else {
      tcni.normalize();
    }
  }
  } catch(e){};
},
/*isSupportedメソッド
 *どんな機能をサポートしているかどうかをチェック
 */
/*boolean*/ isSupported : function( /*string*/ feature, version) {
  return (this.ownerDocument.implementation.hasFeature(feature+"", version+""));
},
/*hasAttributesメソッド
 *ノードが属性を持っているかどうか
 */
/*boolean*/ hasAttributes : function() {
  return (this.attributes.length > 0);
},

/*Document Node Method*/
/*
 *名前空間に対応していないメソッドは、軽量化のため、機能させないようにする。代わりに、**NSメソッドを利用すること。
 *また、createメソッドは工場メソッドである。クラス名をユーザから隠蔽するのに役に立つ。
 *突然、クラス名が変更されても、ライブラリを利用したユーザは、コードを書き換える必要がないなどのメリットがある。
 */
/*Element*/ createElement : function( /*string*/ tagName) {
},
/*createDocumentFragmentメソッド
 *切り貼り用のドキュメントを作る。削除可
 */
/*DocumentFragment*/   createDocumentFragment : function() {
  /*DocumentFragment
   *複数のノードを移したりするのに便宜上、用いられる文書ノード。削除可
   */
  return this.up("$document_fragment").mix({
    nodeName: "#document-fragment",
    nodeValue: null,
    nodeType: /*Node.DOCUMENT_FRAGMENT_NODE*/ 11,
    childNodes: [],
    ownerDocument: this
  });
},
/*createTextNodeメソッド
 *テキストのノードを作る
 */
/*Text*/               createTextNode : function( /*string*/ data) {
  var s = this.$text.up();
  s.data =  s.nodeValue = data+"";
  s.length = data.length;
  s.ownerDocument = this;
  return s;
},
/*createCommentメソッド
 *コメントノードを作る
 */
/*Comment*/            createComment : function( /*string*/ data) {
  var s = this.$text.$comment.up();
  s.data = s.nodeValue = data;
  s.length = data.length;
  s.ownerDocument = this;
  return s;
},
/*createCDATASectionメソッド
 *CDATA領域ノードを作る
 */
/*CDATASection*/       createCDATASection : function( /*string*/ data) {
  var s = this.$text.up();
  s.nodeType = /*Node.CDATA_SECTION_NODE*/ 4;
  s.nodeName = "#cdata-section";
  s.data = s.nodeValue = data;
  s.length = data.length;
  s.ownerDocument = this;
  return s;
},
/*createProcessingInstructionメソッド
 *処理命令ノードを作る
 */
/*ProcessingInstruction*/ createProcessingInstruction : function( /*string*/ target, /*string*/ data) {
  var s = this.up();
  s.nodeType = /*Node.PROCESSING_INSTRUCTION_NODE*/ 7;
  s.target = s.nodeName = target;
  s.data = s.nodeValue = data;
  s.length = data.length;
  s.ownerDocument = this;
  return s;
},
/*createAttribute
 *createAttributeNSを推奨
 */
/*Attr*/               createAttribute : function( /*string*/ name) {
},
/*createEntityReferenceメソッド
 *実体参照ノードを作る
 */
/*EntityReference*/    createEntityReference : function( /*string*/ name) {
  return this.up().mix({
    nodeValue: null,
    nodeType: /*Node.ENTITY_REFERENCE_NODE*/ 5,
    nodeName: name,
    ownerDocument: this
  });
},
/*getElementsByTagNameメソッド
 *getElementsByTagNameNSを推奨
 */
/*NodeList*/           getElementsByTagName : function( /*string*/ tagname) {
  return this.getElementsByTagNameNS("*", tagname);
},
/*importNodeメソッド
 *自身のドキュメントノードに、他のドキュメントノードから作られたノードを取り込みたいときに用いる
 */
/*Node*/               importNode : function( /*Node*/ importedNode, /*boolean*/ deep) {
  var s,
      imn = importedNode.nodeType,
      attr, att, fi, n, uri, ch;
  /*以下の処理は引き渡されたimportedNodeがMSXMLによって解析された
   *データであることを前提にしている
   */
  if (imn === /*Node.ATTRIBUTE_NODE*/ 2) {
    uri = importedNode.namespaceURI;
    uri = (uri === "") ? null : uri; //空文字列はnullとして扱うようにする(MSXMLが空文字列を返す時の対策)
    s = this.createAttributeNS(uri, importedNode.nodeName);
    s.nodeValue = importedNode.nodeValue;
  } else if (imn === /*Node.TEXT_NODE*/ 3) {
    s = this.createTextNode(importedNode.data);
  } else if (imn === /*Node.ELEMENT_NODE*/ 1) {
    s = this.createElementNS(importedNode.namespaceURI, importedNode.nodeName);
    attr = importedNode.attributes;
    for (var i=0;attr[i];++i) { //NamedNodeMapを検索する
      ch = attr[i];
      uri = ch.namespaceURI;
      uri = (uri === "") ? null : uri; //空文字列はnullとして扱うようにする(MSXMLが空文字列を返す時の対策)
      att = this.createAttributeNS(uri, ch.nodeName);
      att.nodeValue = ch.nodeValue;
      s.setAttributeNodeNS(att);
    }
    if (deep) {
      fi = importedNode.firstChild;
      while (fi) { //子ノードを検索して、子供がいれば、importNodeメソッドを再帰的に実行する
        n = this.importNode(fi, true);
        s.appendChild(n);
        fi = fi.nextSibling;
      }
    }
    i = void 0;
  } else if (imn === /*Node.COMMENT_NODE*/ 8) {
    s = this.createComment(importedNode.data);
  } else if (imn === /*Node.DOCUMENT_FRAGMENT_NODE*/ 11) {
    s = this.createDocumentFragment();
    if (deep) {
      ch = importedNode.childNodes;
      for (var i=0,chli=ch.length;i<chli;i++) { //子ノードを検索して、子供がいれば、importNodeメソッドを再帰的に実行する
        n = this.importNode(ch[i], true);
        s.appendChild(n);
      }
    }
    i = chli = void 0;
  } else if (imn === /*Node.CDATA_SECTION_NODE*/ 4) {
    s = this.createCDATASection(importedNode.data);
  } else if (imn === /*Node.ENTITY_REFERENCE_NODE*/ 5) {
    s = this.createEntityReference(importedNode.nodeName);
    if (deep) {
      fi = importedNode.firstChild;
      while (fi) {
        n = this.importNode(fi, true);
        s.appendChild(n);
        fi = fi.nextSibling;
      }
    }
  } else if (imn === /*Node.ENTITY_NODE*/ 6) {
    s = this.$enetity.up();
    s.publicId = importedNode.publicId;
    s.systemId = importedNode.systemId;
    s.notationName = importedNode.notationName;
  } else if (imn === /*Node.PROCESSING_INSTRUCTION_NODE*/ 7) {
    s = this.createProcessingInstruction(importedNode.nodeName, importedNode.nodeValue);
  } else if (imn === /*Node.NOTATION_NODE*/ 12) {
    s = this.up("$notation").up();
    s.publicId = importedNode.publicId;
    s.systemId = importedNode.systemId;
  } else {
    throw new DOMException(/*DOMException.NOT_SUPPORTED_ERR*/ 9);
  }
  importedNode = deep = imn = attr = att = fi = n = uri = ch = void 0;
  return s;
},
/*createElementNSメソッド
 *要素ノードを作る。削除不可
 *例:var s = DOC.createElementNS("http://www.w3.org/2000/svg", "svg:svg");
 */
/*Element*/            createElementNS : function( /*string*/ namespaceURI, /*string*/ qualifiedName) {
  var ele,
      prefix = null,
      localName = null;
  if (!qualifiedName) {
    throw new DOMException(/*DOMException.INVALID_CHARACTER_ERR*/ 5);
  }
  if (qualifiedName.indexOf(":") !== -1){
    var p = qualifiedName.split(":");
    prefix = p[0];
    localName = p[1];
  } else {
    localName = qualifiedName;
  }
  ele = this.$element.up().mix({
        childNodes: [],
        attributes: this.$element.attributes.up(),   //属性を収納
        ownerDocument: this
  });
  ele.namespaceURI = namespaceURI;
  ele.nodeName = ele.tagName = qualifiedName;
  ele.localName = localName;
  ele.prefix = prefix;
  namespaceURI = qualifiedName = prefix = localName = void 0;
  return ele;
},
/*createAttributeNSメソッド
 *属性ノードを作る。setAttributeNSで使うため、削除不可
 */
/*Attr*/               createAttributeNS : function( /*string*/ namespaceURI, /*string*/ qualifiedName) {
  var attr = this.$attr.up(),
      p;
  attr.namespaceURI = namespaceURI;
  attr.nodeName = attr.name = qualifiedName;
  attr.ownerDocument = this;
  if (namespaceURI && (qualifiedName.indexOf(":") !== -1)){
   p = qualifiedName.split(":");
    attr.prefix = p[0];
    attr.localName = p[1];
  } else {
    attr.localName = qualifiedName;
  }
  p = qualifiedName = void 0;
  return attr;
},
/*getElementsByTagNameNSメソッド
 *タグ名と名前空間URIを元に、要素ノード達を取得
 */
/*NodeList*/           getElementsByTagNameNS : function(/*string*/ namespaceURI, /*string*/ localName) {
  if ((typeof namespaceURI !== "string") || (typeof localName !== "string")) {
    throw new Error("Argument not string");
  }
  var td = this.documentElement,
      NodeList = td.getElementsByTagNameNS(namespaceURI, localName);
  if (((localName === td.localName) || (localName === "*"))
      && ((namespaceURI === td.namespaceURI) || (namespaceURI === "*")))  {
    /*documentElementをノードリストに追加*/
    if (NodeList) {
      NodeList.unshift(td);
    } else {
      NodeList = [td];
    }
  }
  td = void 0;
  return NodeList;
},
/*getElementByIdメソッド
 *id属性の値で要素ノードを指定
 */
/*Element*/            getElementById : function( /*string*/ elementId) {
  elementId += "";
  var s = !!this._id[elementId] ? this._id[elementId] : null;
  if (s && (s.getAttributeNS(null, "id") !== elementId)) {
    s = null;
  }
  return s;
}
}).mix( function(_) {
  /*Elementノード*/
  _.up("$element").mix({
    attributes: base("$namedNodeMap"),          //属性を収納
    nodeType: /*Node.ELEMENT_NODE*/ 1,
    nodeValue: null,
    childNodes: [],
    /*
     *名前空間に対応していないメソッドは、軽量化のため、機能させないようにする。代わりに、**NSメソッドを利用すること
     *(getAttributeとsetAttributeは普及しているので機能させる
     */
    /*string*/ getAttribute: function( /*string*/ name) {
      return (this.getAttributeNS(null, name));
    },
    /*void*/ setAttribute: function( /*string*/ name, /*string*/ value) {
      this.setAttributeNS(null, name, value);
    },
    /*void*/ removeAttribute: function( /*string*/ name) {
      this.removeAttributeNS(null, name);
    },
    /*Attr*/ getAttributeNode: function( /*string*/ name) {
    },
    /*Attr*/ setAttributeNode: function( /*Attr*/ newAttr) {
    },
    /*Attr*/ removeAttributeNode: function( /*Attr*/ oldAttr) {
      var s = this.attributes.removeNamedItemNS(oldAttr.namespaceURI, oldAttr.localName);  //attributesから該当するノードを排除
      return s;
    },
    /*NodeList(Array)*/ getElementsByTagName: function( /*string*/ name) {
    },
    /*string*/ getAttributeNS: function( /*string*/ namespaceURI, /*string*/ localName) {
      var n = this.getAttributeNodeNS(namespaceURI, localName);                      //属性ノードを取得する
      if (!n) {
        return null;
      } else {
        return (n.nodeValue);
      }
    },
    /*void*/ setAttributeNS: function( /*string*/ namespaceURI, /*string*/ qualifiedName, /*string*/ value) {
      var atn = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
      /*元来、string型以外の型を許容すべきではないが、他のブラウザ（FirefoxやOpera)でエラーが出ないため許容する*/
      atn.nodeValue = value+"";
      atn.value = value+"";
      this.setAttributeNodeNS(atn);
    },
    /*void*/ removeAttributeNS: function( /*string*/ namespaceURI, /*string*/ localName) {
    },
    /*Attr*/ getAttributeNodeNS: function( /*string*/ namespaceURI, /*string*/ localName) {
      return this.attributes.getNamedItemNS(namespaceURI, localName);
    },
    /*Attr*/ setAttributeNodeNS: function( /*Attr*/ newAttr){
      if (newAttr.ownerDocument !== this.ownerDocument) { //所属ドキュメントが違う場合
        throw new DOMException(/*DOMException.WRONG_DOCUMENT_ERR*/ 4);
      }
      var s = this.attributes.setNamedItemNS(newAttr);
      newAttr.ownerElement = this;
      if ((newAttr.localName === "id") && !this.ownerDocument._id[newAttr.nodeValue]) {                   //id属性であったならば
        this.ownerDocument._id[newAttr.nodeValue] = this; //ドキュメントに登録しておく
      }
      return s;
    },
    /*NodeList(Array)*/ getElementsByTagNameNS: function( /*string*/ namespaceURI, /*string*/ localName) {
      var f = this.firstChild;
      if (f) {
        var s = [],
            n = 0,
            na, ta, d;
        /*　文字列'*'　は、どのような値でも一致させることができるワイルドカード*/
        (namespaceURI === "*") && (na = true);
        (localName === "*") && (ta = true);
      } else {
        namespaceURI = localName = void 0;
        return null;
      }
      while(f) {
        if (f.nodeType === /*Node.ELEMENT_NODE*/ 1) {
          if((ta || (f.localName === localName)) && (na || (f.namespaceURI === namespaceURI))) {
            s[n] = f;
            n++;
          }
          if (f.hasChildNodes()) { //子要素があれば
            d = f.getElementsByTagNameNS(namespaceURI, localName);
            if (d) {
              for (var i=0,dli=d.length;i<dli;++i) {
                s[n] = d[i];
                n++;
              }
            }
          }
        }
        f = f.nextSibling;
      }
      namespaceURI = localName = f = d = ta = na = void 0;
      if (n === 0) {
        s = n = void 0;
        return null; //該当する要素なし
      } else {
        n = void 0;
        return s;
      }
    },
    /*boolean*/ hasAttribute: function( /*string*/ name) {
      return (this.hasAttributeNS(null, name));
    },
    /*boolean*/ hasAttributeNS: function( /*string*/ namespaceURI, /*string*/ localName) {
      if (this.getAttributeNodeNS(namespaceURI, localName)) { //ノードの取得に成功した場合
       return true;
      } else {
       return false;
      }
    }
  });
  /*Textノード*/
  _.up("$text").mix({
    length: 0,
    childNodes: [],
    _capter: [], //eventで利用
    getElementsByTagNameNS: null, //このメソッドは、event.jsで判別式に使われている
    /*substringDataメソッド
     *offsetから数えてcount分の文字列を取り出す
     */
    /*string*/ substringData: function(/*long*/ offset, /*long*/ count) {
      if (offset < 0 || count < 0 || offset > this.length) { //値が負か、データの長さよりoffsetが長いとき、サイズエラーを起こす
        throw new DOMException(/*INDEX_SIZE_ERR*/ 1);
      }
      if (offset + count > this.length) {                    //offsetとcountの和が文字全体の長さを超える場合、offsetから最後までのを取り出す
        count = this.length - offset;
      }
      var s = this.data.substr(offset, count);
      return s;
    },
    /*void*/ appendData: function( /*string*/ arg) {
      this.data += arg;
      this.length = this.data.length;
    },
    /*void*/ insertData: function( /*long*/ offset, /*string*/ arg) {
      var pre = this.substring(0, offset - 1);                 //文字列を二つに分けた、前半部分
      var next = this.substring(offset, this.length - offset); //後半部分
      this.data = pre + this.data + next;
      this.length = this.data.length;
    },
    /*void*/ deleteData: function( /*long*/ offset, /*long*/ count) {
      var pre = this.substring(0, offset - 1);                    //残すべき前半部分
      var next = this.substring(offset + count, this.length - 1); //後半部分
      if (offset + count > this.length) {                         //offsetとcountの和が文字全体の長さを超える場合、offsetから最後までのを削除
        next = "";
      }
      this.data = pre + next;
      this.length = this.data.length;
    },
    /*void*/ replaceData: function( /*long*/ offset, /*long*/ count, /*string*/ arg) {
      if (offset < 0 || count < 0 || offset > this.length) { //値が負か、データの長さよりoffsetが長いとき、サイズエラーを起こす
        throw new DOMException(/*INDEX_SIZE_ERR*/ 1);
      }
      this.deleteData(offset, count);
      this.insertData(offset, arg);
    },
    nodeType: /*Node.TEXT_NODE*/ 3,
    nodeName: "#text",

    /*Text*/ splitText: function(/*long*/ offset) {
      var pre = this.substringData(0, offset - 1);              //このノードからoffsetまでの文字列を取り出して、
      this.replaceData(0, this.length - 1, pre);                //このノードの文字列と置き換える
      var next = "";
      if (this.length !== offset) {                             //このノードの文字列の長さがoffsetに等しくない場合
        next = this.substringData(offset, this.length - 1);     //文字列を取り出す。（等しい場合は文字列を取り出さない）
      }
      var nnode = this.ownerDocument.createTextNode(next);
      if (this.parentNode) {
        this.parentNode.insertBefore(nnode, this.nextSibling);
      }
      return nnode;
    }
  })
  .up("$comment").mix({
    nodeType: /*Node.COMMENT_NODE*/ 8,
    nodeName: "#comment"
  });

  /*Attrノード*/
  _.up("$attr").mix( {
	  nodeType: /*Node.ATTRIBUTE_NODE*/ 2,
	  nodeValue: null,
	  childNodes: [],
	  _capter: [] //eventで利用
  });

  /*Notationノード
   *DTDの記法の情報を取り扱うノード。<!NOTATION >か、処理命令で記法は表現されうる。
   */
  _.up("$notation").mix(function() {
	this.publicId = this.systemId = this.nodeValue = null;
	this.nodeType = /*Node.NOTATION_NODE*/ 12;
  });

  /*注意
   *以下のノードは、もし、DOMを展開する前に、XMLプロセッサが実体参照の読み込みを行うのであれば、文書中に挿入される必要はない。
   */
  /*Entity
   *解析対象（外）実体ノード。削除可
   */
  _.up("$entity").mix({
    publicId: null,
    systemId: null,
    notationName: null, //解析対象外実体のための記法名。解析対象実体ではnull
    nodeValue: null,
    nodeType: /*Node.ENTITY_NODE*/ 6
  });
});


Array.prototype.item = function( /*long*/ index) {
  if (!this[index]) {
    return null;
  }
  return (this[index]);
};
/*ノードリストはArrayで代用。
  interface NodeList {
    Node               item(in unsigned long index);
    readonly attribute unsigned long    length;
  };
*/

/*NamedNodeMap
 *ノードの集合。ノードリストと違って、順序が決まっていない。削除不可
 */
base("$namedNodeMap").mix( {
 /*number*/ length : 0,
/*
 *名前空間に対応していないメソッドは、軽量化のため、機能させないようにする。代わりに、**NSメソッドを利用すること
 */
/*Node*/ getNamedItem : function(/*string*/ name){
  },
/*Node*/ setNamedItem : function(/*Node*/ arg){
  },
/*Node*/ removeNamedItem : function(/*string*/ name){
  },
/*Node*/ item : function( /*long*/ index) {
    return this[index];
  },
/*getNamedItemNSメソッド
 *名前空間と名前を使って、ノードの集合から特定のノードを取り出す
 */
/*Node*/ getNamedItemNS : function(/*string*/ namespaceURI, /*string*/ localName) {
    var ta;
    for (var i=0,tali=this.length;i<tali;i++) {
      ta = this[i];
      if ((ta.namespaceURI === namespaceURI) && (ta.localName === localName)) { //名前空間と名前がそれぞれ一致すれば
        this._num = i;                                                      //場所をいったん記録しておく。（setNamedItemNSで使う）
        return ta;
      }
    }
    i = ta = void 0;
    return null;
  },
/*setNamedItemNSメソッド
 *ノードの集合に特定のノードを設定
 */
/*Node*/ setNamedItemNS : function(/*Node*/ arg) {
    var tgans = this.getNamedItemNS(arg.namespaceURI, arg.localName),
        s;
    if (tgans) {                          //ノードがすでにあるならば、
      s = this[this._num];
      this[this._num] = arg;
      arg = tgans = void 0;
      return s;
    } else {
      if (arg.ownerElement !== void 0) { //ノードがもはや別の要素で使われている
        throw new DOMException(/*DOMException.INUSE_ATTRIBUTE_ERR*/ 10);
      }
      this[this.length] = arg;            //新たに、argを項目として追加する
      this.length +=  1;
      arg = void 0;
      return null;
    }
  },
/*removeNamedItemNSメソッド
 *名前空間と名前を使って、ノードの集合から特定のノードを排除
 */
/*Node*/ removeNamedItemNS : function(/*string*/ namespaceURI, /*string*/ localName) {
    var tgans = this.getNamedItemNS(namespaceURI, localName);
    if (!tgans) {                          //ノードが見当たらない場合、
      throw new DOMException(/*DOMException.NOT_FOUND_ERR*/ 8);
    } else {
      var s = this[this._num];
      delete (this[this._num]);
      this.length -= 1;
      tgas = void 0;
      return s;
    }
  }
});

/*#endif // _DOM_IDL_*/

/*

// File: http://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.idl

#ifndef _EVENTS_IDL_
#define _EVENTS_IDL_

#include "dom.idl"
#include "views.idl"

#pragma prefix "dom.w3c.org"
module events
{

  typedef dom::DOMString DOMString;
  typedef dom::DOMTimeStamp DOMTimeStamp;
  typedef dom::Node Node;

  interface EventListener;
  interface Event;
*/
/*EventExceptionクラス
 *イベント専用の例外クラス。
 */
function EventException() {
  DOMException.call(this);
  if (this.code === 0) {
    this.message = "Uuspecified Event Type Error";
  }
};
/*unsigned short  EventException.UNSPECIFIED_EVENT_TYPE_ERR = 0;*/

EventException.prototype = Object._create(DOMException);


/*  // Introduced in DOM Level 2:*/

/*$documentオブジェクトに、EventTargetのAPIを追加*/
base("$document").mix(function() {
/*void*/  this.addEventListener = function( /*string*/ type, /*EventListener*/ listener, /*boolean*/ useCapture) {
  this.removeEventListener(type, listener, useCapture);  //いったん、（あれば）リスナーを離す。
  var s = base("EventListener").up().initialize(useCapture, type, listener), //リスナーを作成
      t = type.charAt(0),
      that;
  this._capter.push(s);                 //このノードにリスナーを登録しておく
  if ((t !== "D") && (t !== "S") && (type !== "beginEvent") && (type !== "endEvent") && (type !== "repeatEvent")) { //MouseEventsならば
    that = this;
    that._tar && that._tar.attachEvent("on" +type, (function(node, type) {
      return  function(){
        var evt = node.ownerDocument.createEvent("MouseEvents");
        evt.initMouseEvent(type, true, true, node.ownerDocument.defaultView, 0);
        node.dispatchEvent(evt);
        /*cancelBubbleプロパティについては、IEのMSDNなどを参照*/
        node.ownerDocument._window.event.cancelBubble = true;
        evt = void 0;
      };
    })(that, type)
    );
  }
  type = listener = useCapture = s = t = that = void 0;
};
/*void*/  this.removeEventListener = function( /*string*/ type, /*EventListener*/ listener, /*boolean*/ useCapture) {
  var tce = this._capter;
  for (var i=0,tcli=tce.length;i<tcli;i++){
    if (tce[i]._listener === listener) {  //登録したリスナーと一致すれば
      tce[i] = void 0;
    }
  }
  i = tcli = tce = void 0;
};
/*boolean*/ this.dispatchEvent = function( /*Event*/ evt) {
  if (!evt.type) { //Eventの型が設定されていないとき
    throw new EventException(/*EventException.UNSPECIFIED_EVENT_TYPE_ERR*/ 0);
  }
  var te = this,
      td = te.ownerDocument,
      etime = evt.timeStamp,
      etype = evt.type,
      ebub = evt.bubbles,
      tob,
      toli,
      type = /*Event.CAPTURING_PHASE*/ 1,
      ecptype = /*Event.CAPTURING_PHASE*/ "1",
      ebptype = /*Event.BUBBLING_PHASE*/ "3",
      tce;
  if (!td._isLoaded) {
    /*以下では、画像の処理に時間がかかりそうな場合、処理落ちとして、遅延処理
     *を行い、バッファリングにイベント送付処理をためていく作業となる
     */
    if (!td._limit_time_) {
      td._limit_time_ = etime;
    } else if ((etime - td._limit_time_) > 1000) {
      /*1秒を超えたらバッファにため込んで後で使う*/
      tob = td.implementation._buffer_ || [];
      toli = tob.length;
      tob[toli] = this;
      tob[toli+1] = evt;
      td.implementation._buffer_ = tob;
      te = td = etime = etype = ebub = tob = toli = type = void 0;
      return true;
    }
  }
  evt.target = te;
  evt.eventPhase = 1;//Event.CAPTURING_PHASE
  //このノードからドキュメントノードにいたるまでの、DOMツリーのリストを作成しておく
  td[ebptype] = null;
  /*以下の処理では、documentElementのparentNodeが
   *Documentノードではなく、nullになっていることを前提としている。
   *したがって、documentElementのparentNodeがもし、Documentノードのオブジェクトならば、以下を書き換えるべきである
   */
  while (te.parentNode) {
    te.parentNode[ecptype] = te;
    te[ebptype] = te.parentNode;
    te = te.parentNode;
  }
  td[ecptype] = te;
  te[ebptype] = td;
  /*最初に捕獲フェーズでDOMツリーを下っていき、イベントのターゲットについたら、
   *そこで、浮上フェーズとして折り返すように、反復処理をおこなう。
   */
  te = this;
  while (td) {
    evt.currentTarget = td;
    if (td === te) { //イベントのターゲットに到着（折り返し地点）
      type = 2;//Event.AT_TARGET;
    }
    evt.eventPhase = type;
    tce = td._capter; //tceは登録しておいたリスナーのリスト
    for (var j=0,tcli=tce.length;j<tcli;++j){
      if (tce[j] && (etype === tce[j]._type)) {
        tce[j].handleEvent(evt);
      }
    }
    if (evt._stop) {
      break; //stopPropagationメソッドが呼ばれたら、停止する
    }
    if (td === te) {
      if (!ebub) {
        break; //浮上フェーズに移行せず、停止する
      }
      type = 3;//Event.BUBBLING_PHASE;
    }
    td = td[type];
  }
  var ed = evt._default;
  evt = te = tce = n = td = type = tob = j = tcli = etype = etime = ebub = ecptype = ebptype = void 0;
  return ed;
};
});

/*EventListenerオブジェクト
 * Eventとイベントの型を結びつけるオブジェクト
 */

base("EventListener").mix( {
	initialize: function (cap, type, listener) {
      this._cap = cap;
      this._type = type;
      this._listener = listener;
      return this;
    },
/*void*/ handleEvent: function( /*Event*/ evt) {
    try {
      var ph = evt.eventPhase,
          cap = this._cap;
      if (ph === /*Event.CAPTURING_PHASE*/ 1) { //イベントフェーズが捕獲段階であることを示し
        cap = cap ? false : true;         //このオブジェクト（EventListenr)が捕獲フェーズを指定するならば、リスナーを作動させる。指定しなければ、作動しない。
      }
      if (!cap && (evt.type === this._type)) {
        this._listener(evt);
      }
      evt = ph = cap = void 0;
    } catch (e) {
    }
  }
});

/*$eventオブジェクト
 *イベントの雛形となる。プロパティもすべて含めて、必須
 */
// PhaseType
/*unsigned short Event.CAPTURING_PHASE   = 1;
/*unsigned short Event.AT_TARGET         = 2;
/*unsigned short Event.BUBBLING_PHASE    = 3;*/

base("$event").mix( {
  /*DOMTimeStamp*/     timeStamp : 0,
  /*DOMString*/        type : null,
  /*EventTarget*/      target : null,
  /*EventTarget*/      currentTarget : null,
  /*unsigned short*/   eventPhase : /*Event.CAPTURING_PHASE*/ 1,
  /*boolean*/          bubbles : false,
  /*boolean*/          cancelable : false,
  _stop : false, //stopPropagationメソッドで使う
  _default : true, //preventDefaultメソッドで使う
  /*void*/ stopPropagation : function(){
    this._stop = true;
  },
  /*void*/ preventDefault : function(){
    if (this.cancelable) {
      this._default = false;
      /*IEのみで使えるreturnValueプロパティ*/
      this.target.ownerDocument._window.event.returnValue = false;
    }
  },
  /*void*/ initEvent : function( /*string*/ eventTypeArg, /*boolean*/ canBubbleArg, /*boolean*/ cancelableArg) {
    this.type = eventTypeArg;
    this.bubbles = canBubbleArg;
    this.cancelable = cancelableArg;
    eventTypeArg = canBubbleArg = cancelableArg = void 0;
  }
} );
/*Documentノードに直接結びつける
function DocumentEvent() {
}*/
/*Event*/ base("$document").mix( {
  /*__$eventプロパティはcreateEventを高速化するために、前もって設定しておいたもの*/
  __$event: base("$event"),
  createEvent: function( /*string*/ eventType) {
	  var evt = ( this.__$event[eventType] ||   this.__$event).up();
	  evt.type = eventType;
	  evt.timeStamp = +(new Date());
	  eventType = void 0;
	  return evt;
  }
} );

/*UIEventオブジェクト
 * UIEventsとsがついているのは、createEventで識別するための名前であるため
 */

base("$event").up("UIEvents").mix( {
  /*views::AbstractView  this.view */
  /*long*/  detail: 0,
  initUIEvent: function( /*string*/ typeArg, /*boolean*/ canBubbleArg, /*boolean*/ cancelableArg, /*views::AbstractView*/ viewArg, /*long*/ detailArg) {
    this.initEvent(typeArg, canBubbleArg, cancelableArg);
    this.detail = detailArg;
    this.view = viewArg;
  }

/*MouseEventsオブジェクト*/

} ).up("MouseEvents").mix( {
  /*long*/             screenX: 0,
  /*long*/             screenY: 0,
  /*long*/             clientX: 0,
  /*long*/             clientY: 0,
  /*boolean*/         ctrlKey: false,
                           shiftKey: false,
                           altKey: false,
                           metaKey: false,
  /*unsigned short   this.button;
  /*EventTarget      this.relatedTarget*/
/*void*/ initMouseEvent: function( /*string*/ typeArg, /*boolean*/ canBubbleArg, /*boolean*/ cancelableArg, /*views::AbstractView*/ viewArg, /*long*/ detailArg, /*long*/ screenXArg, /*long*/ screenYArg, /*long*/ clientXArg, /*long*/ clientYArg, /*boolean*/ ctrlKeyArg, /*boolean*/ altKeyArg, /*boolean*/ shiftKeyArg, /*boolean*/ metaKeyArg, /*unsigned short*/ buttonArg, /*EventTarget*/ relatedTargetArg) {
  this.initUIEvent(typeArg, canBubbleArg, cancelableArg, viewArg, detailArg);
  this.screenX = screenXArg;
  this.screenY = screenYArg;
  this.clientX  = clientXArg;
  this.clientY  = clientYArg;
  this.ctrlKey  = ctrlKeyArg;
  this.shiftKey = shiftKeyArg;
  this.altKey   = altKeyArg;
  this.metaKey  = metaKeyArg;
  this.button = buttonArg;
  this.relatedTarget = relatedTargetArg;
}
} ).mix( function() {
	/*createEventメソッドのため*/
  this.$event.MouseEvents = this;
} );



base("$event").up("MutationEvents").mix( {
/*void*/  initMutationEvent: function(/*string*/ typeArg, /*boolean*/ canBubbleArg,
    /*boolean*/ cancelableArg, /*Node*/ relatedNodeArg, /*string*/ prevValueArg, /*string*/ newValueArg,
    /*string*/ attrNameArg, /*unsigned short*/ attrChangeArg) {
    this.initEvent(typeArg, canBubbleArg, cancelableArg);
    this.relatedNode = relatedNodeArg;
    this.prevValue = prevValueArg;
    this.newValue = newValueArg;
    this.attrName = attrNameArg;
    this.attrChange = attrChangeArg;
    typeArg = canBubbleArg = cancelableArg = relatedNodeArg = prevValueArg = newValueArg = attrNameArg = attrChangeArg = void 0;
  },
  /*Node*/  relatedNode: null,
  /*string*/  prevValue: null,
                  newValue: null,
                  attrName: null,
  /*unsigned short*/  attrChange: 2
} );
    // attrChangeType
/*unsigned short  MutationEvent.MODIFICATION  = 1;
/*unsigned short  MutationEvent.ADDITION      = 2;
/*unsigned short  MutationEvent.REMOVAL       = 3;*/

/*MutationEventsの発動のために、setAttributeNodeNSを上書きする。ファイル統合やmakeの際は、
 *重複するのでコアモジュールのメソッドは削除する。モジュールテストを行うために、
 *このような形式をとることにする。なお、追加部分には区別を付けるために、前後にコメントを挿入する。
 */
/*Attr*/ base("$document").$element.mix({
    setAttributeNodeNS : function( /*Attr*/ newAttr){
  if (newAttr.ownerDocument !== this.ownerDocument) { //所属ドキュメントが違う場合
    throw new DOMException(/*DOMException.WRONG_DOCUMENT_ERR*/ 4);
  }
  var s = this.attributes.setNamedItemNS(newAttr);
  newAttr.ownerElement = this;
  if ((newAttr.localName === "id") && !this.ownerDocument._id[newAttr.nodeValue]) {  //id属性であったならば
    this.ownerDocument._id[newAttr.nodeValue] = this; //ドキュメントに登録しておく
  }
  /*ここから*/
  var evt = this.ownerDocument.createEvent("MutationEvents");
  if (!s) { //ノードがなければ
    /*initMutationEventメソッドは軽量化のため省略する*/
    evt.initEvent("DOMAttrModified", true, false);
    evt.relatedNode = newAttr;
    evt.newValue = newAttr.nodeValue;
    evt.attrName = newAttr.nodeName;
  } else {
    evt.initMutationEvent("DOMAttrModified", true, false, newAttr, s.nodeValue, newAttr.nodeValue, newAttr.nodeName, /*MutationEvent.MODIFICATION*/ 1);
  }
  this.dispatchEvent(evt); //このとき、MutationEventsが発動
  evt = void 0;
  /*ここまで追加*/
  return s;
},

/*Node*/ insertBefore : function( /*Node*/ n, ref) {
  var tp = this.parentNode,
      rp, evt,
      te = this,
      j = 0,
      t,
      s, descend, di;
  while (tp) {                               //先祖をたどっていく
    if (tp === n) {                          //先祖要素が追加ノードならばエラー
      throw new DOMException(/*DOMException.HIERARCHY_REQUEST_ERR*/ 3);
    }
    tp = tp.parentNode;
  }
  if (this.ownerDocument !== n.ownerDocument) { //所属Documentの生成元が違うならば
    throw new DOMException(/*DOMException.WRONG_DOCUMENT_ERR*/ 4);
  }
  if (n.parentNode) {                  //親要素があれば
    n.parentNode.removeChild(n);
  }
  if (!ref) {
    /*参照要素がNULLの場合、要素を追加する(appendChildと同じ効果）*/
    if (!this.firstChild) {
      this.firstChild = n;
    }
    if (this.lastChild) {
      n.previousSibling = this.lastChild;
      this.lastChild.nextSibling = n;
    }
    this.lastChild = n;
    this.childNodes.push(n);
    n.nextSibling = null;
  } else {
    if (ref.parentNode !== this) {              //参照ノードが子要素でない場合
      throw new DOMException(/*DOMException.NOT_FOUND_ERR*/ 8);
    }
    t = this.firstChild;
    if (t === ref) {
      this.firstChild = n;
    }
    while (t) {
      if (t === ref) {
        this.childNodes.splice(j, 1, n, ref);   //Arrayのspliceを利用して、リストにnノードを追加
        break;
      }
      ++j;
      t = t.nextSibling;
    }
    rp = ref.previousSibling;
    if (rp) {
      rp.nextSibling = n;
    }
    ref.previousSibling = n;
    n.previousSibling = rp;
    n.nextSibling = ref;
  }
  n.parentNode = this;
  if ((n.nodeType===/*Node.ENTITY_REFERENCE_NODE*/ 5) || (n.nodeType===/*Node.DOCUMENT_FRAGMENT_NODE*/ 11)) {
    /*実体参照や、文書フラグメントノードだけは子ノードを検索して、
     *それらを直接文書に埋め込む作業を以下で行う
     */
    var ch = n.childNodes.concat([]); //Arrayのコピー
    for (var i=0,chli=ch.length;i<chli;i++) {
      this.insertBefore(ch[i], n);
    }
    ch = void 0;
  }
  /*ここから*/
  evt = this.ownerDocument.createEvent("MutationEvents");
  evt.initMutationEvent("DOMNodeInserted", true, false, this, null, null, null, null);
  n.dispatchEvent(evt);
  /*以下のDOMNodeInsertedIntoDocumentイベントは、間接的、あるいは直接ノードが
   *挿入されたときに発火する。間接的な挿入とは、サブツリーを作っておいて、それをいっぺんに挿入する場合など。
   *このイベントは浮上しないことに注意を要する
   */
  do {
    s = te;
    te = te.parentNode;
  } while (te);
  if (s !== this.ownerDocument.documentElement) {
    evt = descend = tp = rp = te = s = di = void 0;
    return n;
  }
  evt = this.ownerDocument.createEvent("MutationEvents");
  evt.initMutationEvent("DOMNodeInsertedIntoDocument", false, false, null, null, null, null, null);
  n.dispatchEvent(evt);
  if (!n.hasChildNodes()) {                       //子ノードがないので終了
    return n;
  }
  if (n.getElementsByTagNameNS) {
    descend = n.getElementsByTagNameNS("*", "*"); //全子孫要素を取得
  } else {
    descend = n.childNodes;
  }
  if (descend) {
    for (var i=0,dli=descend.length;i<dli;++i) {
      di = descend[i];
      di.dispatchEvent(evt);
      di = null;
    }
  }
  evt = descend = tp = rp = j = t = te = s = di = void 0;
  return n;
},

/*Node*/ removeChild : function( /*Node*/ ele) {
  if (ele.parentNode !== this) {                                        //親が違う場合
    throw new DOMException(/*DOMException.NOT_FOUND_ERR*/ 8);
  }
  if (ele.ownerDocument !== this.ownerDocument) { //所属ドキュメントが違う場合
    throw new Error();
  }
  /*ここから*/
  var evt = this.ownerDocument.createEvent("MutationEvents"),
      descend;
  /*以下のDOMNodeRemovedFromDocumentイベントは、間接的、あるいは直接ノードが
   *除去されたときに発火する。間接的な除去とは、サブツリーをいっぺんに除去する場合など。
   *このイベントは浮上しないことに注意を要する
   */
  evt.initMutationEvent("DOMNodeRemovedFromDocument", false, false, null, null, null, null, null);
  ele.dispatchEvent(evt);
  if (ele.getElementsByTagNameNS) {
    descend = ele.getElementsByTagNameNS("*", "*"); //全子孫要素を取得
  } else {
    descend = ele.childNodes;
  }
  if (descend) {
    evt.initMutationEvent("DOMNodeRemovedFromDocument", false, false, null, null, null, null, null);
    for (var i=0,dli=descend.length;i<dli;++i) {
      var di = descend[i];
      evt.target = di;
      di.dispatchEvent(evt);
      di = void 0;
    }
  }
  evt.initMutationEvent("DOMNodeRemoved", true, false, this, null, null, null, null);
  ele.dispatchEvent(evt);
  evt = descend = void 0;
  /*ここまで追加*/
  ele.parentNode = null;
  var t = this.firstChild,
      j = 0;
  while (t) {
    if (t === ele) {
      this.childNodes.splice(j, 1);      //Arrayのspliceを利用して、リストからeleノードを排除
      break;
    }
    ++j;
    t = t.nextSibling;
  }
  if (this.firstChild === ele) {
    this.firstChild = ele.nextSibling;
  }
  if (this.lastChild === ele) {
    this.lastChild = ele.previousSibling;
  }
  ele.previousSibling && (ele.previousSibling.nextSibling = ele.nextSibling);
  ele.nextSibling && (ele.nextSibling.previousSibling = ele.previousSibling);
  ele.nextSibling = ele.previousSibling = null;
  t = j = void 0;
  return ele;
}
});

base("$document").$text.mix(function(_) {
/*void*/ _.appendData = function( /*string*/ arg) {
  var pd = this.data,
      evt;
  this.data += arg;
  this.length = this.data.length;
  /*ここから*/
  evt = this.ownerDocument.createEvent("MutationEvents");
  evt.initMutationEvent("DOMCharacterDataModified", true, false, null, pd, this.data, null, null);
  this.parentNode.dispatchEvent(evt);
  evt = arg = pd = void 0;
  /*ここまで追加*/
};
/*void*/ _.insertData = function( /*long*/ offset, /*string*/ arg) {
  var pd = this.data,
      pre = this.substring(0, offset - 1),                 //文字列を二つに分けた、前半部分
      next = this.substring(offset, this.length - offset), //後半部分
      evt;
  this.data = pre + this.data + next;
  this.length = this.data.length;
  /*ここから*/
  evt = this.ownerDocument.createEvent("MutationEvents");
  evt.initMutationEvent("DOMCharacterDataModified", true, false, null, pd, this.data, null, null);
  this.parentNode.dispatchEvent(evt);
  evt = arg = pd = pre = next = void 0;
  /*ここまで追加*/
};
/*void*/ _.deleteData = function( /*long*/ offset, /*long*/ count) {
  var pd = this.data,
      pre = this.substring(0, offset - 1),                    //残すべき前半部分
      next = this.substring(offset + count, this.length - 1), //後半部分
      evt;
  if (offset + count > this.length) {                         //offsetとcountの和が文字全体の長さを超える場合、offsetから最後までのを削除
    next = "";
  }
  this.data = pre + next;
  this.length = this.data.length;
  /*ここから*/
  evt = this.ownerDocument.createEvent("MutationEvents");
  evt.initMutationEvent("DOMCharacterDataModified", true, false, null, pd, this.data, null, null);
  this.parentNode.dispatchEvent(evt);
  evt = pd = void 0;
  /*ここまで追加*/
};
});


// _EVENTS_IDL_

/*
// File: http://www.w3.org/TR/2000/REC-DOM-Level-2-Style-20001113/stylesheets.idl

#ifndef _STYLESHEETS_IDL_
#define _STYLESHEETS_IDL_

#include "dom.idl"

#pragma prefix "dom.w3c.org"
module stylesheets
{

  typedef dom::DOMString DOMString;
  typedef dom::Node Node;
*/

/*StyleSheet
 *スタイルシート文書を示す。削除不可。
 */
base("$StyleSheet").mix( {
  /*コンストラクタメソッドとして使う*/
  _create: function() {
    return this;
  },
  type:  "text/css",
  disabled:  false,
  /*Node*/ ownerNode:  null,
  /*StyleSheet*/ parentStyleSheet:  null,
  href:  null,
  title:  ""
} )
 .on( "_create", function() {
  /*MediaList*/ this.media = this.$MediaList.up();
} )
 .mix( function(_) {

/*StyleSheetList
 *このインターフェースはArrayで代用する
function StyleSheetList() {
    readonly attribute unsigned long    length;
    StyleSheet         item(in unsigned long index);
  };
*/

_.up("$MediaList").mix( {
  mediaText: "",
  length: 0,
/*string*/ item : function(/*long*/ index) {
    return (this[index]);
  },
/*void*/   deleteMedium : function(/*string*/ oldMedium) {
    for (var i=0,tli=this.length;i<tli;++i) {
      if (this[i] === oldMedium) {
        delete this[i];
        --this.length;
        return;
      }
    }
    throw (new DOMException(DOMException.NOT_FOUND_ERR));
  },
/*void*/   appendMedium : function(/*string*/ newMedium) {
    this[this.length] = newMedium;
    ++this.length;
  }
} );

_.LinkStyle = function() {
  /*StyleSheet*/ this.sheet = _.up();
};

_.DocumentStyle = function() {
  /*StyleSheetList*/ this.styleSheets = [];
};
} );
/*
#endif // _STYLESHEETS_IDL_
*/
/*
// File: http://www.w3.org/TR/2000/REC-DOM-Level-2-Style-20001113/css.idl

#ifndef _CSS_IDL_
#define _CSS_IDL_

#include "dom.idl"
#include "stylesheets.idl"
#include "views.idl"

#pragma prefix "dom.w3c.org"
module css
{

  typedef dom::DOMString DOMString;
  typedef dom::Element Element;
  typedef dom::DOMImplementation DOMImplementation;

  interface CSSRule;
  interface CSSStyleSheet;
  interface CSSStyleDeclaration;
  interface CSSValue;
  interface Counter;
  interface Rect;
  interface RGBColor;
*/
/*CSSRuleList
 *Arrayで代用
function CSSRuleList {
    readonly attribute unsigned long    length;
    CSSRule            item(in unsigned long index);
  };
*/
/*CSSRule
 *CSSのルールを表現する。CSSStyleRuleと統合
 */

/*// RuleType
CSSRule.UNKNOWN_RULE                   = 0;
CSSRule.STYLE_RULE                     = 1;
CSSRule.CHARSET_RULE                   = 2;
CSSRule.IMPORT_RULE                    = 3;
CSSRule.MEDIA_RULE                     = 4;
CSSRule.FONT_FACE_RULE                 = 5;
CSSRule.PAGE_RULE                      = 6;*/

base("$CSSStyleRule").mix( {
  cssText: "",
/*CSSStyleSheet parentStyleSheet;*/
/*CSSRule*/       parentRule: null,
  type: /*CSSRule.STYLE_RULE*/ 1,
  selectorText: "",
/*CSSStyleDeclaration*/ style: (base("$CSSStyleDeclaration"))
} ).mix( function() {
	this.up("$CSSMediaRule").mix( {
	  type: /*CSSRule.MEDIA_RULE*/ 4,
	  /*stylesheets::MediaList*/ media: (base("$StyleSheet").$MediaList.up()),
	  /*CSSRuleList*/ cssRules: [],
	
	  /*long*/ insertRule: function( /*string*/ rule, /*long*/ index) {
	    this.cssRules.splice(index,rule,1);
	    this.media.appendMedium(rule);
	    return this;
	  },
	  /*void*/ deleteRule: function( /*long*/ index) {
	  }
	} );
	
	this.up("$CSSFontFaceRule").mix( {
	  type: /*CSSRule.FONT_FACE_RULE*/ 5
	/*CSSStyleDeclaration this.style;*/
	} );
	
	this.up("$CSSPageRule").mix( {
	  type: /*CSSRule.PAGE_RULE*/ 6,
	  selectorText: ""
	/*CSSStyleDeclaration this.style;*/
	} );
	
	this.up("$CSSImportRule").mix( {
	  type: /*CSSRule.IMPORT_RULE*/ 3,
	  href: "",
	/*stylesheets::MediaList*/ media: base("$StyleSheet").$MediaList.up(),
	/*CSSStyleSheet*/ styleSheet: null
	} );
	
	this.up("$CSSCharsetRule").mix( {
	  type: /*CSSRule.CHARSET_RULE*/ 2,
	  encoding: ""
	} );
	
	this.up("$CSSUnknownRule").type = /*CSSRule.UNKNOWN_RULE*/ 0;
} );

/*CSSStyleDeclaration
 *CSSの宣言ブロックを表現。削除不可。
 */
base("$CSSStyleDeclaration").mix( {
  _new$: function() {
	var s = this.up();
    s._list = []; //内部のリスト
    s._list._fontSize = s._list._opacity = null;
    return s;
  },
  cssText : "",
  /*long*/ length : 0,
  /*CSSRule*/ parentRule : null,
  _urlreg : /url\(#([^)]+)/,
  /*getPropertyValueメソッド
   *CSSの値を返す。この値は継承ではなくて、明示的に表記されているもの
   */
/*string*/   getPropertyValue : function( /*string*/ propertyName) {
    var tg = this.getPropertyCSSValue(propertyName);
    if (tg) {                             //見つかった場合
      var tc = tg.cssText;
      return (tc.slice(tc.indexOf(":")+1));
    } else {
      return "";
    }
  },
  /*getPropertyCSSValueメソッド
   *CSSValueオブジェクトを返す。このメソッドは判別に用いているので、削除不可。
   */
/*CSSValue*/ getPropertyCSSValue : function( /*string*/ propertyName) {
    var prop = propertyName,
        ti, tc;
    propertyName += ":";
    if (propertyName === ":") { //どんなデータ型でも、文字列に変換する機能をJavaScriptが持つことに注意
      return null;
    }
    for (var i=0,tl=this._list,tli=tl.length;i<tli;++i) {
      ti = tl[i];
      tc = ti.cssText;
      if (tc.indexOf(propertyName) > -1) {  //プロパティ名に合致するCSSValueオブジェクトが見つかった場合
        ti._empercents = tl._fontSize;
        i = tl = tli = tc = prop = propertyName = void 0;
        return ti;
      }
    }
    i = tl = tli = prop = propertyName = void 0;
    return null;
  },
  /*removePropertyメソッド
   *プロパティを宣言内から除去
   */
/*string*/   removeProperty : function( /*string*/ propertyName) {
    var tg = this.getPropertyCSSValue(propertyName);
    if (tg) {                        //見つかった場合
      this._list.splice(tg._num,1);  //Arrayのspliceを利用して、リストからCSSValueオブジェクトを排除
      --this.length;
    }
  },
  /*getPropertyPriorityメソッド
   *importantなどのpriorityを取得する
   */
/*string*/   getPropertyPriority : function( /*string*/ propertyName) {
    var tg = this.getPropertyCSSValue(propertyName);
    if (tg) {                        //見つかった場合
      return (tg._priority);
    } else {
      return "";
    }
  },
  _isFillStroke : {
    "fill" : 1,
    "stroke" : 1
  },
  _isColor : {
    "color" : 1
  },
  _isStop : {
    "stop-color" : 1
  },
  _isRS : {
    "r" : 1,
    "#" : 1
  },
  /*setPropertyメソッド
   *プロパティを宣言内で、明示的に設定。継承は無視する
   */
/*void*/     setProperty : function( /*string*/ propertyName, /*string*/ value, /*string*/ priority) {
    var cssText = propertyName,
        tg = null,
        ti, paintType,
        uri = null,
        color = null,
        fill, stroke, stop;
    if (this[propertyName]) {
      tg = this.getPropertyCSSValue(propertyName);
    }
    cssText += ":";
    cssText += value;
    if (this._isFillStroke[propertyName]) {
      /*fill、strokeプロパティは別途、SVGPaintで処理（JavaScriptでは、型キャストを使えないため）
       *CSSPrimitiveValueオブジェクトとSVGPaintオブジェクトを最後に置き換える
       */
      ti = tg ? tg : base("$CSSValue").$SVGColor.$SVGPaint._new$();
      paintType =
        (this._isRS[value.charAt(0)] || ti._keywords[value]) ?
          /*SVGPaint.SVG_PAINTTYPE_RGBCOLOR*/ 1
        : (value === "none") ?
          /*SVGPaint.SVG_PAINTTYPE_NONE*/ 101
        : (this._urlreg.test(value)) ?                   //fill属性の値がurl(#id)ならば
          /*SVGPaint.SVG_PAINTTYPE_URI*/ 107
        :(value === "currentColor") ?
          /*SVGPaint.SVG_PAINTTYPE_CURRENTCOLOR*/ 102
        : /*SVGPaint.SVG_PAINTTYPE_UNKNOWN*/ 0;
      if (paintType === 1) {
        color = value;
      } else if (paintType === 107) {
        uri = RegExp.$1;
      }
      ti.setPaint(paintType, uri, color, null);
      paintType = uri = color = void 0;
    } else if (this._isStop[propertyName]) {
      ti = tg ? tg : base("$CSSValue").$SVGColor._new$();
      if (value === "currentColor") {
        ti.colorType = /*SVGColor.SVG_COLORTYPE_CURRENTCOLOR*/ 3;
      } else {
        ti.colorType = /*SVGColor.SVG_COLORTYPE_RGBCOLOR*/ 1;
        ti.setRGBColor(value);
      }
    } else {
      ti = tg ? tg : base("$CSSValue").$CSSPrimitiveValue.up();
    }
    ti._priority = priority;
    ti.cssText = cssText;
    if (!tg) {
      //_numプロパティはremovePropertyメソッドで利用する
      ti._num = this._list.length;
      this._list[ti._num] = ti;
      this[propertyName] = 1;
      ++this.length;
    }
    if (value === "inherit") {
      ti.cssValueType = /*CSSValue.CSS_INHERIT*/ 0;
    } else if (propertyName === "opacity") {
      this._list._opacity = +value;
    } else if (propertyName === "font-size") {
      if (/(%|em|ex)/.test(value)) {
        tg = "_" +RegExp.$1;
        ti[tg] = parseFloat(value);
      } else {
        this._em = this._ex = this["_%"] = null;
        this._list._fontSize = parseFloat(value);
      }
    }
    cssText = ti = tg = void 0;
  },
  /*itemメソッド
   *リストの位置にあるプロパティ名を取得する。宣言内のすべてのプロパティ名を取得するのに便利
   */
/*string*/   item : function( /*long*/ index) {
    if (index >= this.length) { //indexの位置にCSSValueが指定されていないとき
      var s = "";
    } else {
      var s = this._list[index].cssText.substring(0, this._list[index].cssText.indexOf(":"));
    }
    return s;
  }
});

base("$CSSValue").mix( {
/*    // UnitTypes
CSSValue.CSS_INHERIT                    = 0;
CSSValue.CSS_PRIMITIVE_VALUE            = 1;
CSSValue.CSS_VALUE_LIST                 = 2;
CSSValue.CSS_CUSTOM                     = 3;*/
  cssText : "",
  cssValueType : /*CSSValue.CSS_CUSTOM*/ 3,
  _isDefault : 0 //デフォルトであるかどうか（独自のプロパティ)
} )
 .up("$CSSPrimitiveValue").mix( {

/* var t = CSSPrimitiveValue;
t.CSS_UNKNOWN                    = 0;
t.CSS_NUMBER                     = 1;
t.CSS_PERCENTAGE                 = 2;
t.CSS_EMS                        = 3;
t.CSS_EXS                        = 4;
t.CSS_PX                         = 5;
t.CSS_CM                         = 6;
t.CSS_MM                         = 7;
t.CSS_IN                         = 8;
t.CSS_PT                         = 9;
t.CSS_PC                         = 10;
t.CSS_DEG                        = 11;
t.CSS_RAD                        = 12;
t.CSS_GRAD                       = 13;
t.CSS_MS                         = 14;
t.CSS_S                          = 15;
t.CSS_HZ                         = 16;
t.CSS_KHZ                        = 17;
t.CSS_DIMENSION                  = 18;
t.CSS_STRING                     = 19;
t.CSS_URI                        = 20;
t.CSS_IDENT                      = 21;
t.CSS_ATTR                       = 22;
t.CSS_COUNTER                    = 23;
t.CSS_RECT                       = 24;
t.CSS_RGBCOLOR                   = 25;*/

  _n: [1, 
        0.01,
        1,
        1,
        1,
        35.43307,
        3.543307,
        90,
        1.25,
        15,
        1,
        180 / Math.PI, 90/100,
        1,
        1000,
        1,
        1000,
        1], //CSS_PX単位への変換値（なお、CSS_SはCSS_MSに、CSS_RADとCSS_GRADはCSS_DEGに、CSS_KHZはCSS_HZに統一）
  cssValueType: /*CSSValue.CSS_PRIMITIVE_VALUE*/ 1,
  primitiveType: /*CSSPrimitiveValue.CSS_UNKNOWN*/ 0,
  _value: null,
  _percent: 0, //単位に%が使われていた場合、このプロパティの数値を1%として使う
  _empercent: 0,
  _em: null,
  _ex: null,
  "_%": null, //emが単位の場合、getComputedStyleメソッドなどで使う
  /*void*/ setFloatValue: function(/*short*/ unitType, /*float*/ floatValue) {
    if ((/*CSSPrimitiveValue.CSS_UNKNOWN*/ 0 >= unitType) && (unitType >= /*CSSPrimitiveValue.CSS_STRING*/ 19)) { //浮動小数点数単位型をサポートしないCSS単位である場合
      throw new DOMException(/*DOMException.INVALID_ACCESS_ERR*/ 15);
    }
    this.primitiveType = unitType;
    this._value = floatValue * this._n[unitType-1];  //値はあらかじめ、利用しやすいように変換しておく
  },
  /*getFloatValueメソッド
   *別の単位に変換可能。
   */
  _regd: /[\d\.]+/,
  /*float*/ getFloatValue: function(/*short*/ unitType) {
    if ((/*CSSPrimitiveValue.CSS_UNKNOWN*/ 0 >= unitType) && (unitType >= /*CSSPrimitiveValue.CSS_STRING*/ 19)) { //浮動小数点数単位型をサポートしないCSS単位である場合
      throw new DOMException(/*DOMException.INVALID_ACCESS_ERR*/ 15);
    }
    if (this._value || (this._value === 0)) { //すでに、setFloatValueメソッドによって_valueプロパティが設定されていた場合
      return (this._value / this._n[unitType-1]);
    } else {
      var tc = this.cssText,
          n = tc.slice(-1),
          type = 0,
          s = +(tc.match(this._regd));
      s = isNaN(s) ? 0 : s;
      if (n >= "0" && n <= "9") {
        type = /*CSSPrimitiveValue.CSS_NUMBER*/ 1;
        if (unitType === 1) {
          unitType = tc = n = type = void 0;
          return s;
        }
      } else if (n === "%") {
        s *= this._percent;
        type = /*CSSPrimitiveValue.CSS_PERCENTAGE*/ 2;
      } else if ((n === "m") && (tc.charAt(tc.length-2) === "e")) {
        s *= this._empercent;
        type = /*CSSPrimitiveValue.CSS_EMS*/ 3;
      } else if ((n === "x") && (tc.charAt(tc.length-2) === "e")) {
        type = /*CSSPrimitiveValue.CSS_EXS*/ 4;
      } else if ((n === "x") && (tc.charAt(tc.length-2) === "p")) {
        type = /*CSSPrimitiveValue.CSS_PX*/ 5;
      } else if ((n === "m") && (tc.charAt(tc.length-2) === "c")) {
        type = /*CSSPrimitiveValue.CSS_CM*/ 6;
      } else if ((n === "m") && (tc.charAt(tc.length-2) === "m")) {
        type = /*CSSPrimitiveValue.CSS_MM*/ 7;
      } else if (n === "n") {
        type = /*CSSPrimitiveValue.CSS_IN*/ 8;
      } else if (n === "t") {
        type = /*CSSPrimitiveValue.CSS_PT*/ 9;
      } else if (n === "c") {
        type = /*CSSPrimitiveValue.CSS_PC*/ 10;
      }
      s = s * this._n[type-1] / this._n[unitType-1];
      tc = n = type = unitType = void 0;
      return s;
    }
  },
  /*void*/ setStringValue: function(/*short*/ stringType, /*string*/ stringValue) {
    if (/*CSSPrimitiveValue.CSS_DIMENSION*/ 18 >= stringType && stringType >= /*CSSPrimitiveValue.CSS_COUNTER*/ 23) { //文字列型をサポートしないCSS単位である場合
      throw new DOMException(/*DOMException.INVALID_ACCESS_ERR*/ 15);
    }
    this._value = stringValue;
  },
  /*string*/ getStringValue: function(/*short*/ stringType) {
    if (/*CSSPrimitiveValue.CSS_DIMENSION*/ 18 >= stringType && stringType >= /*CSSPrimitiveValue.CSS_COUNTER*/ 23) { //文字列型をサポートしないCSS単位である場合
      throw new DOMException(/*DOMException.INVALID_ACCESS_ERR*/ 15);
    }
    return (this._value);
  },
  /*Counter*/ getCounterValue: function() {
    if (this.primitiveType !== /*CSSPrimitiveValue.CSS_COUNTER*/ 23) { //Counter型ではないとき
      throw new DOMException(/*DOMException.INVALID_ACCESS_ERR*/ 15);
    }
    return (new Counter());
  },
  /*Rect*/ getRectValue: function() {
    if (this.primitiveType !== /*CSSPrimitiveValue.CSS_RECT*/ 24) { //Rect型ではないとき
      throw new DOMException(/*DOMException.INVALID_ACCESS_ERR*/ 15);
    }
    return (new Rect());
  },
  /*RGBColor*/ getRGBColorValue: function() {
    if (this.primitiveType !== /*CSSPrimitiveValue.CSS_RGBCOLOR*/ 25) { //RGBColor型ではないとき
      throw new DOMException(/*DOMException.INVALID_ACCESS_ERR*/ 15);
    }
    var s = new RGBColor(),
        rgbColor = this.cssText,
        n = base("$CSSValue").$SVGColor._keywords[rgbColor];
    if (rgbColor.indexOf("%", 5) > 0) {      // %を含むrgb形式の場合
      rgbColor = rgbColor.replace(/[\d.]+%/g, function(t) {
        return Math.round((2.55 * parseFloat(t)));
      });
    } else if (rgbColor.indexOf("#") > -1) {  //#を含む場合
      rgbColor = rgbColor.replace(/[\da-f][\da-f]/gi, function(s) {
        return parseInt(s, 16);
      });
    }
    n = n || rgbColor.match(/\d+/g);
    s.red.setFloatValue(/*CSSPrimitiveValue.CSS_NUMBER*/ 1, parseFloat(n[0]));
    s.green.setFloatValue(/*CSSPrimitiveValue.CSS_NUMBER*/ 1, parseFloat(n[1]));
    s.blue.setFloatValue(/*CSSPrimitiveValue.CSS_NUMBER*/ 1, parseFloat(n[2]));
    n = rgbColor = void 0;
    return (s);
  }
 } )
/*CSSValueList
 *Arrayで代用する
 */
 .up("$CSSValueList").mix( {
  cssValueType: /*CSSValue.CSS_VALUE_LIST*/ 2,
  length: 0,
/*CSSValue*/ item: function( /*long*/ index) {
    return (this[index]);
  }
 } );

function RGBColor() {
  var cs = base("$CSSValue").$CSSPrimitiveValue;
  this.red = cs.up();
  this.green = cs.up();
  this.blue = cs.up();
  cs = void 0;
  this.red.primitiveType = this.green.primitiveType = this.blue.primitiveType = /*CSSPrimitiveValue.CSS_NUMBER*/ 1;
};

function Rect() {
  var cs = base("$CSSValue").$CSSPrimitiveValue;
  this.top = cs.up();
  this.right = cs.up();
  this.bottom = cs.up();
  this.left = cs.up();
  cs = void 0;
};

function Counter() {
  this.identifier = this.listStyle = this.separator = "";
};

function ElementCSSInlineStyle() {
  var cs = base("$CSSStyleDeclaration");
  this.style = cs._new$();
  this._attributeStyle = cs._new$(); //プレゼンテーション属性の値を格納する
  cs = void 0;
};

/*CSS2Properties
 *削除不可
 *さらにSVG CSSを付け加えている
 */
var n = "none",
    m = "normal",
    a = "auto",
    CSS2Properties = {
  fill : "black",
  stroke : n,
  cursor : a,
  visibility : "visible",
  display : "inline-block",
  opacity : "1",
  fillOpacity : "1",
  strokeWidth : "1",
  strokeDasharray : n,
  strokeDashoffset : "0",
  strokeLinecap : "butt",
  strokeLinejoin : "miter",
  strokeMiterlimit : "4",
  strokeOpacity : "1",
  writingMode : "lr-tb",
  fontFamily : "serif",
  fontSize : "12",
  color : "black",
  fontSizeAdjust : n,
  fontStretch : m,
  fontStyle : m,
  fontVariant : m,
  fontWeight : m,
  font : "inline",

//# Gradient properties:

  stopColor : "black",
  stopOpacity : "1",
  textAnchor : "start",
  azimuth : "center",
                                        // raises(dom::DOMException) on setting
  //簡略プロパティに関しては、初期値を再考せよ
  clip : a,
  direction : "ltr",
  letterSpacing : m,
  lineHeight : m,
  overflow : "visible",
  textAlign : "left",
  textDecoration : n,
  textIndent : "0",
  textShadow : n,
  textTransform : n,
  unicodeBidi : m,
  verticalAlign : "baseline",
  whiteSpace : m,
  wordSpacing : m,
  zIndex : a,
//  #

  mask : n,
  markerEnd : n,
  markerMid : n,
  markerStart : n,
  fillRule : "nonzero",

//# Filter Effects properties:

  enableBackground : "accumulate",
  filter : n,
  floodColor : "black",
  floodOpacity : "1",
  lightingColor : "white",

//# Interactivity properties:

  pointerEvents : "visiblePainted",

//# Color and Painting properties:

  colorInterpolation : "sRGB",
  colorInterpolationFilters : "linearRGB",
  colorProfile : a,
  colorRendering : a,
  imageRendering : a,
  marker : "",
  shapeRendering : a,
  textRendering : a,

//# Text properties:

  alignmentBaseline : "",
  baselineShift : "baseline",
  dominantBaseline : a,
  glyphOrientationHorizontal : "0deg",
  glyphOrientationVertical : a,
  kerning : a
};
n = m = a = void 0;
CSS2Properties.visibility._n = 1; //初期値の設定（_setPaintで使う）

/*$CSSStyleSheetオブジェクト*/

base("$StyleSheet").up("$CSSStyleSheet").on("_create", function() {
/*CSSRuleList*/  this.cssRules = [];
}).mix( {
/*CSSRule*/ ownerRule: null,
/*long*/     insertRule: function( /*string*/ rule, /*long*/ index) {
  var s = new CSSStyleRule(), style = s.style, a, sc = rule.match(/\{[\s\S]+\}/), m;
  s.parentStyleSheet = this;
  style.cssText = rule;
  //style値の解析;
  sc = sc.replace(/^[^a-z\-]+/, "")
         .replace(/\:\s+/g, ":")
         .replace(/\s*;[^a-z\-]*/g, ";");
  a = sc.split(";");
  for (var i=0, ali=a.length;i<ali;++i) {
      ai = a[i],
      m = ai.split(":");
      if (ai !== "") {
        style.setProperty(m[0], m[1]);
      }
      ai = m = void 0;
    }
  a = sc = style = void 0;
  this.cssRules.splice(index,s,1);
},
/*void*/     deleteRule: function(/*long*/ index) {
  this.cssRules.splice(index, 1);
}
} );

/*getComputedStyle関数
 *最近の計算値を取得する。Document.defaultViewはSafariがグローバル(window)にサポートしていないため付ける。
 */
/*interface ViewCSS : views::AbstractView {*/
base("$document").defaultView = base("$viewCSS").mix({
  _cssstyle: base("$CSSStyleDeclaration"),
/*CSSStyleDeclaration*/ getComputedStyle: function( /*Element*/ elt, /*string*/ pseudoElt) {
  var s = this._cssstyle._new$(),
      el, es,
      eso = 1;
  //クロージャを利用して、カスケーディングを実現する
  s.getPropertyCSSValue = (function(elt, td){
    return function( /*string*/ propertyName) {
      var el = elt,
          css = null,
          n;
      while (el && (!css || (css.cssValueType === /*CSSValue.CSS_INHERIT*/ 0))) {
        if (el._runtimeStyle && el._runtimeStyle[propertyName]) {
          css = el._runtimeStyle.getPropertyCSSValue(propertyName);
        } else if (el.style && el.style[propertyName]) {
          css = el.style.getPropertyCSSValue(propertyName);
        } else if (el._attributeStyle && el._attributeStyle[propertyName]) {
          //プレゼンテーション属性を探す
          css = el._attributeStyle.getPropertyCSSValue(propertyName);
        } else if (el._rules) {
          //スタイルシートのルールを探す
          for (var i=0,eli=el._rules.length;i<eli;++i) {
            el._rules[i].style[propertyName] && (css = el._rules[i].style.getPropertyCSSValue(propertyName));
          }
        }
        el = el.parentNode;
      }
      if (!css || (css.cssValueType === /*CSSValue.CSS_INHERIT*/ 0)) {
        //デフォルト値を探す
        td && (css = td[propertyName]);
      }
      if (css && css.setRGBColor && ((css.paintType === /*SVGPaint.SVG_PAINTTYPE_CURRENTCOLOR*/ 102) || (css.colorType === /*SVGColor.SVG_COLORTYPE_CURRENTCOLOR*/ 3))) {
        css.setRGBColor(this.getPropertyValue("color"));
      } else if (css && (css._em || css._ex || css["_%"])) {
        el = elt;
        n = 1;
        while (el) {
          if (el.style._list._fontSize) {
            n = el.style._list._fontSize;
            break;
          }
          el = el.parentNode;
        }
        if (css._em) {
          n *= css._em;
        } else if (css._ex) {
          n *= css._ex * 0.5;
        } else if (css["_%"]) {
          n *= css["_%"] / 100;
        }
        css.cssText = "font-size:" +n+ "px";
      }
      el = void 0;
      return css;
    };
   })(elt, this._defaultCSS); //_defaultCSSはデフォルト値の設定
  el = elt;
  while (el) {
    if (el.style) {
      es = el.style._list._opacity || el._attributeStyle._list._opacity;
      eso *= es || 1;
    }
    el = el.parentNode;
  }
  s._list._opacity = eso;
  el = pelt = eso = es = void 0;
  s._document = elt.ownerDocument;
  return s;
}});

/*getOverrideStyleメソッド
 *指定した要素の上書きスタイルシートを取得。
 */
/*function DocumentCSS : stylesheets::DocumentStyle {*/
base("$document").mix( base("$StyleSheet").DocumentStyle);
/*CSSStyleDeclaration*/ base("$document").getOverrideStyle = function( /*Element*/ elt, /*string*/ pseudoElt) {
  var tar = elt;
  if (!!tar._runtimeStyle) {
    return (tar._runtimeStyle);
  } else {
    var s = base("$CSSStyleDeclaration")._new$(),
         setProp = s.setProperty;
    tar._runtimeStyle = s;
  }
  s.setProperty = (function(setProp, s){
    return function(propertyName, value, priority) {
      setProp.call(s, propertyName, value, priority);
      var tar = elt,
          el = tar._tar,
          isFill = false,
          isStroke = false;
      if ((tar.localName === "g") || (tar.localName === "a")) {
        var sl = tar.getElementsByTagNameNS("http://www.w3.org/2000/svg", "*");
        if (sl) {
          for (var i=0,sli=sl.length;i<sli;++i) {
            var di = sl[i];
            di.getScreenCTM && NAIBU._setPaint(di, di.getScreenCTM());
            di = void 0;
          }
          sl = void 0;
        }
        el = null;
      }
      if (!el) {
        return;
      }
      tar.getScreenCTM && NAIBU._setPaint(tar, tar.getScreenCTM());
      el = tar = value = void 0;
    };
  })(setProp, s);
  return s;
};
/*createCSSStyleSheetメソッド
 *文書のスタイルシートを作成
 */
/*interface DOMImplementationCSS : DOMImplementation {*/
/*CSSStyleSheet*/ base("DOMImplementation").createCSSStyleSheet = function( /*string*/ title, /*string*/ media) {
  var s = base("$StyleSheet").up("$CSSStyleSheet")._create();
  s.title = title;
  var nm = s.$MediaList.up();
  nm.mediaText = media;
  if (media && (media !== "")) {
    var mes = media.split(",");  //文字列をコンマで区切って配列に
    for (var i=0,mli=mes.length;i<mli;++i) {
      nm.appendMedium(mes[i]);   //メディアリストに値を加えていく
    }
  }
  s.media = nm;
  return s;
};
/*
#endif // _CSS_IDL_
*/
// File: smil.idl
/*
#ifndef _SMIL_IDL_
#define _SMIL_IDL_

#include "dom.idl"

#pragma prefix "dom.w3c.org"
module smil
{
  typedef dom::DOMString DOMString;
*/
/*ElementTimeControlはSVGAnimationElementに統合させる。
 *というのは、多重継承が難しいため
 */
function ElementTimeControl(ele) {
  this._tar = ele;
  /*_startと_endプロパティはミリ秒数を収納する。
   *_startはアニメ開始時の秒数のリスト。_finishはアニメ終了時の秒数のリスト。
   *なお、文書読み込み終了時（アニメ開始時刻）の秒数を0とする。
   */
  this._start = [];
  this._finish = null;
};
ElementTimeControl.prototype = {
  /*void*/  beginElement : function() {
    var ttd = this.ownerDocument, evt = ttd.createEvent("TimeEvents");
    evt.initTimeEvent("beginEvent", ttd.defaultView, 0);
    this.dispatchEvent(evt);
  },
  /*void*/  endElement : function() {
    var ttd = this.ownerDocument, evt = ttd.createEvent("TimeEvents");
    evt.initTimeEvent("endEvent", ttd.defaultView, 0);
    this.dispatchEvent(evt);
  },
  /*void*/  beginElementAt : function(/*float*/ offset) {
    var ntc = this.ownerDocument.documentElement.getCurrentTime(),
        start = this._start || [];
    for (var i=0,sli=start.length;i<sli;++i) {
      if (start[i] === (offset+ntc)) {
        ntc = start = offset = void 0;
        return;
      }
    }
    start.push(offset + ntc);
    this._start = start;
  },
  /*void*/  endElementAt : function(/*float*/ offset) {
    var ntc = this.ownerDocument.documentElement.getCurrentTime(),
        fin = this._finish || [];
    for (var i=0,fli=fin.length;i<fli;++i) {
      if (fin[i] === (offset+ntc)) {
        ntc = fin = offset = void 0;
        return;
      }
    }
    fin.push(offset + ntc);
    this._finish = fin;
  }
};

base("$event").up("TimeEvents").mix( {
  /*readonly attribute views::AbstractView  this.view;*/
  /*readonly attribute long*/   detail: 0,
/*void*/  initTimeEvent: function(/*DOMString*/ typeArg,
                                     /*views::AbstractView*/ viewArg,
                                     /*long*/ detailArg) {
    this.type = typeArg;
    this.view = viewArg;
    this.detail = detailArg;
  }
} );
//#endif // _SMIL_IDL_


//これを頭に付けたら、内部処理用
var  NAIBU = {};

/*
// File: svg.idl
#ifndef _SVG_IDL_
#define _SVG_IDL_
// For access to DOM2 core
#include "dom.idl"
// For access to DOM2 events
#include "events.idl"
// For access to those parts from DOM2 CSS OM used by SVG DOM.
#include "css.idl"
// For access to those parts from DOM2 Views OM used by SVG DOM.
#include "views.idl"
// For access to the SMIL OM used by SVG DOM.
#include "smil.idl"
#pragma prefix "dom.w3c.org"
#pragma javaPackage "org.w3c.dom"
module svg
{
  typedef dom::DOMString DOMString;
  typedef dom::DOMException DOMException;
  typedef dom::Element Element;
  typedef dom::Document Document;
  typedef dom::NodeList NodeList;
  // Predeclarations
  interface SVGElement;
  interface SVGLangSpace;
  interface SVGExternalResourcesRequired;
  interface SVGTests;
  interface SVGFitToViewBox;
  interface SVGZoomAndPan;
  interface SVGViewSpec;
  interface SVGURIReference;
  interface SVGPoint;
  interface SVGMatrix;
  interface SVGPreserveAspectRatio;
  interface SVGAnimatedPreserveAspectRatio;
  interface SVGTransformList;
  interface SVGAnimatedTransformList;
  interface SVGTransform;
  interface SVGICCColor;
  interface SVGColor;
  interface SVGPaint;
  interface SVGTransformable;
  interface SVGDocument;
  interface SVGSVGElement;
  interface SVGElementInstance;
  interface SVGElementInstanceList;
*/
function SVGException(code) {
  /*unsigned short*/  this.code = code;
  this.message = (this.code === /*SVGException.SVG_WRONG_TYPE_ERR*/ 0) ?
                   "SVG Wrong Type Error"
               : (this.code === /*SVGException.SVG_INVALID_VALUE_ERR*/ 1) ?
                   "SVG Invalid Value Error"
               : (this.code === /*SVGException.SVG_MATRIX_NOT_INVERTABLE*/ 2) ?
                   "SVG　Matrix Not Invertable"
               : "";
};
SVGException.prototype = Object._create(Error);
// SVGExceptionCode
/*const unsigned short SVGException.SVG_WRONG_TYPE_ERR           = 0;
/*const unsigned short SVGException.SVG_INVALID_VALUE_ERR        = 1;
/*const unsigned short SVGException.SVG_MATRIX_NOT_INVERTABLE    = 2;*/

/*関数スコープを避けるため、グローバルスコープでevalさせる関数*/
NAIBU.eval = function(code) {
  var doc = document,
      script = doc.createElement("script");
  script.text = code;
  (doc.documentElement || doc.body).appendChild(script);
};

/*$svgelement
 *すべてのSVG関連要素の雛形となるオブジェクト
 */
base.$1 = base("$document").$element.up("$svgelement").mix( {
  /*SVGの名前空間をつけて継承オブジェクトを作るため*/
  upsvg: function(name) {
    return this.up("http://www.w3.org/2000/svg" + name);
  },
  initialize: function () {
    SVGStylable.call(this);             //ElementCSSInlineStyleのインタフェースを継承
    /*interface SVGTransformable : SVGLocatable
    *TransformListはtransform属性を行列で表現したあとのリスト構造
      */
    /*readonly attribute SVGAnimatedTransformList*/ this.transform = new SVGAnimatedTransformList();
    //描画の際、SVGStylabaleで指定しておいたプロパティの処理をする
    this.addEventListener("DOMAttrModified", function(evt){
      if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
        return;
      }
      var name = evt.attrName,
          tar = evt.target,
          evn = evt.newValue;
      if (!!CSS2Properties[name] || (name.indexOf("-") > -1)) { //スタイルシートのプロパティならば
        tar._attributeStyle.setProperty(name, evn, "");
      }
      if (evt.relatedNode.localName === "id") { //xml:idあるいはid属性ならば
        tar.id = evn;
      } else if ((name === "transform") && !!tar.transform) {
        var degR = tar._degReg,
            coma = evn.match(tar._comaReg),   //コマンド文字にマッチ translate
            list = evn.match(tar._strReg),    //カッコ内のリストにマッチ (10 20 30...)
            a,b,c,d,e,f,
            lis,
            com,
            deg,
            rad,
            degli,
            s,
            cm,
            degz,
            etod = tar.ownerDocument.documentElement,
            ttb = tar.transform.baseVal;
        //transform属性の値を、SVGTransformListであるtransformプロパティに結びつける
        for (var j=0,cli=coma.length;j<cli;j++) {
          s = etod.createSVGTransform();
          lis = list[j],
          com = coma[j];
          deg = lis.match(degR);
          degli = deg.length;
          if (degli === 6) {
            cm = s.matrix;
            cm.a = +(deg[0]);
            cm.b = +(deg[1]);
            cm.c = +(deg[2]);
            cm.d = +(deg[3]);
            cm.e = +(deg[4]);
            cm.f = +(deg[5]);
          } else {
              if (degli === 3) {
              degz = +(deg[0]);
              s.setRotate(degz, +(deg[1]), +(deg[2]));
            } else if (degli <= 2) {
              degz = +(deg[0]);
              if (com === "translate") {
                s.setTranslate(degz, +(deg[1] || 0));
              } else if (com === "scale") {
                s.setScale(degz, +(deg[1] || deg[0]));
              } else if (com === "rotate") {
                s.setRotate(degz, 0, 0);
              } else if (com === "skewX") {
                s.setSkewX(degz);
              } else if (com === "skewY") {
                s.setSkewY(degz);
              }
            }
          }
          ttb.appendItem(s);
        }
        degR = coma = list = a = b = c = d = e = f = lis = com = deg = rad = degli = s = cm = degz = etod = ttb = void 0;
      } else if (name === "style") {
        var style = tar.style,
            a,
            ai,
            m;
        style.cssText = evn;
        if (evn !== "") {
          //style属性値の解析
          a = evn.replace(tar._shouReg, "")
                 .replace(tar._conReg, ":")
                 .replace(tar._bouReg, ";")
                 .split(";");
          for (var i=0, ali=a.length;i<ali;++i) {
            ai = a[i],
            m = ai.split(":");
            if (ai !== "") {
              style.setProperty(m[0], m[1]);
            }
            ai = m = void 0;
          }
        }
        a = style = void 0;
      } else if (name === "class") {
        tar.className.baseVal = evn;
      } else if (name.indexOf("on") === 0) {           //event属性ならば
        /*ECMA 262-3においては、eval("(function(){})")はFunctionオブジェクトを返さなければならない
         *ところが、IEでは、undefinedの値を返してしまう。
         *他のブラウザではECMAの仕様にしたがっているようなので、IEだけの問題であることに注意
         */
        NAIBU._temp_doc = tar.ownerDocument;
        NAIBU.eval("with(NAIBU._temp_doc){document._s = function(evt){" +evn+ "}}");
        var v = name.slice(2);
        v = (v === "load")   ? "SVGLoad"
          : (v === "unload") ? "SVGUnload"
          : (v === "abort")  ? "SVGAbort"
          : (v === "error")  ? "SVGError"
          : (v === "resize") ? "SVGResize"
          : (v === "scroll") ? "SVGScroll"
          : (v === "zoom")   ? "SVGZoom"
          : (v === "begin")  ? "beginEvent"
          : (v === "end")    ? "endEvent"
          : (v === "repeat") ? "repeatEvent"
          : v;
        tar.addEventListener(v, document._s, false);
      } else if (evt.relatedNode.nodeName === "xml:base") { //xml:base属性ならば
        tar.xmlbase = evn;
      } else if (!!tar[name] && (tar[name] instanceof SVGAnimatedLength)) {
        var tea = tar[name],
            tod = tar.nearestViewportElement || tar.ownerDocument.documentElement,
            tvw = tod.viewport.width,
            tvh = tod.viewport.height,
            s,
            n = evn.slice(-2),
            m = n.charAt(1),
            _parseFloat = parseFloat,
            type = (m >= "0" && m <= "9") ?
                     /*SVGLength.SVG_LENGTHTYPE_NUMBER*/ 1
                 : (m === "%") ?
                     /*SVGLength.SVG_LENGTHTYPE_PERCENTAGE*/ 2
                 : (n === "em") ?
                     /*SVGLength.SVG_LENGTHTYPE_EMS*/ 3
                 : (n === "ex") ?
                     /*SVGLength.SVG_LENGTHTYPE_EXS*/ 4
                 : (n === "px") ?
                   /*SVGLength.SVG_LENGTHTYPE_PX*/ 5
                 : (n === "cm") ?
                 /*SVGLength.SVG_LENGTHTYPE_CM*/ 6
                 : (n === "mm") ?
                   /*SVGLength.SVG_LENGTHTYPE_MM*/ 7
                 : (n === "in") ?
                   /*SVGLength.SVG_LENGTHTYPE_IN*/ 8
                 : (n === "pt") ?
                   /*SVGLength.SVG_LENGTHTYPE_PT*/ 9
                 : (n === "pc") ?
                   /*SVGLength.SVG_LENGTHTYPE_PC*/ 10
                 : /*SVGLength.SVG_LENGTHTYPE_NUMBER*/ 1;
        if (type === 2) {
          if (tar._x1width[name]) {
            tea.baseVal._percent = tvw * 0.01;
          } else if (tar._y1height[name]) {
            tea.baseVal._percent = tvh * 0.01;
          } else {
            tea.baseVal._percent = Math.sqrt((tvw*tvw + tvh*tvh) / 2) * 0.01;
          }
        }
        s = _parseFloat(evn);
        s = isNaN(s) ? 0 : s;
        tea.baseVal.newValueSpecifiedUnits(type, s);
        tea = tod = tvw = tvh = n = type = _parseFloat = s = void 0;
      }
      evt = _parseFloat = evn = name = tar = v = null;
    }, false);
  },

/*_inserted__メソッド
 * VMLの挿入をするための、内部処理のメソッド
 */
  _inserted__: function(tar) {
  var tnext = tar.nextSibling,
      sar = tar._tar,
      spar = tar.parentNode._tar,
      snext = null;
  if (sar && spar) {
    if (!tnext) {
      spar.appendChild(sar);
    } else {
      while(tnext) {
        if (tnext._tar && tnext._tar.parentNode) {
          /*use要素や実体参照は_tarプロパティをもっていないので、無視する*/
          snext = tnext._tar;
          break;
        }
        tnext = tnext.nextSibling;
      }
      snext && (spar = snext.parentNode);
      spar.insertBefore(sar, snext);
    }
  }
  tnext = sar = spar = snext = void 0;
  },
  /*以下の正規表現は属性のパーサの際に用いる*/
  _degReg: /[\-\d\.e]+/g,
  _comaReg: /[A-Za-z]+(?=\s*\()/g,
  _strReg:  /\([^\)]+\)/g,
  _syouReg: /^[^a-z\-]+/,
  _conReg: /\:\s+/g,
  _bouReg: /\s*;[^a-z\-]*/g,
  /*_cacheMatrixプロパティはSVGMatrixのキャッシュとして、
   *getCTMメソッドで使う
   */
  _cacheMatrix: null,
  /*以下のオブジェクトは単位がパーセント付きの属性の名前を示し、処理に使う*/
  _x1width: {
      "x" : 1,
      "x1" : 1,
      "x2" : 1,
      "width" : 1,
      "cx" : 1
  },
  _y1height: {
      "y" : 1,
      "y1" : 1,
      "y2" : 1,
      "height" : 1,
      "cy" : 1
  },
  /*String*/              id: null,        //id属性の値
  /*String*/              xmlbase: null,   //xml:base属性の値
  /*SVGSVGElement*/       ownerSVGElement: null,  //ルート要素であるsvg要素
  /*readonly SVGElement*/ viewportElement: null,  //ビューポートを形成する要素(多くはsvg要素)
  /*readonly attribute SVGElement*/ nearestViewportElement: null,
  /*readonly attribute SVGElement*/ farthestViewportElement: null,

  /*interface SVGLocatable*/
  /*SVGRect*/     getBBox: function(){
    var s = base("$SVGRect").up(),
        data = this._tar.path.value,
        vi = this.ownerDocument.documentElement.viewport,
        el = vi.width,
        et = vi.height,
        er = 0,
        eb = 0,
        degis = data.match(/[0-9\-]+/g),
        nx,
        ny;
    /*要素の境界領域を求める（四隅の座標を求める）
     *etは境界領域の上からビューポート(例えばsvg要素）の上端までの距離であり、eｂは境界領域の下からビューポートの下端までの距離
     *elは境界領域の左からビューポートの左端までの距離であり、erは境界領域の右からビューポートの右端までの距離
     */
    for (var i=0,degisli=degis.length;i<degisli;i+=2) {
      nx = +(degis[i]),
      ny = +(degis[i+1]);
      el = el > nx ? nx : el;
      et = et > ny ? ny : et;
      er = er > nx ? er : nx;
      eb = eb > ny ? eb : ny;
    }
    s.x      = el;
    s.y      = et;
    s.width  = er - el;
    s.height = eb - et;
    nx = ny = data = degis =el = et = er = eb = vi = void 0;
    return s;
  },

  /*getCTMメソッド
   *CTMとは現在の利用座標系に対する変換行列
   *注意点として、SVG1.1とSVG Tiny1.2では内容が異なる。たとえば、
   *1.2ではgetCTMが言及されていない
   *もし、要素の中心座標を取得したい人がいれば、transformプロパティのconsolidateメソッドを使うこと
   */
  /*SVGMatrix*/   getCTM: function() {
    var s, m;
    if (this._cacheMatrix) { //キャッシュがあれば
      s = this._cacheMatrix;
    } else {
      m = this.transform.baseVal.consolidate();
      if (m) {
        m = m.matrix;
      } else {
        m = this.ownerDocument.documentElement.createSVGMatrix();
      }
      if (this.parentNode && !!this.parentNode.getCTM) {
        s = this.parentNode.getCTM().multiply(m);
      } else {
        s = m;
      }
      m = void 0;
      this._cacheMatrix = s; //キャッシュをためて次回で使う
    }
    return s;
  },

  /*SVGMatrix*/   getScreenCTM: function(){
    if (!this.parentNode) {
      return null;
    }
    return ((this.nearestViewportElement || this.ownerDocument.documentElement)
        .getScreenCTM().multiply(this.getCTM()));
  },

  /*getTransformToElementメソッド
   *これは、あるelementへの変換行列を計算して返す
   *たとえばある要素から別の要素への引越しをする際の変換行列を算出することが可能
   */
  /*SVGMatrix*/   getTransformToElement: function(/*SVGElement*/ element ){
    var s = this.getScreenCTM().inverse().multiply(element.getScreenCTM());
    return s;
  }
});

base("$SVGAnimatedBoolean").mix( {
  /*boolean*/  animVal: true,
                    baseVal: true
} );

base("$SVGAnimatedString").mix( {
  /*String*/ animVal: "",
                 baseVal: ""
} );

base("$SVGStringList").mix(Array.prototype)
 .mix( {
  /*readonly unsigned long*/ numberOfItems: 0,
  /*void*/   clear: function(){
    for (var i=0, tli=this.length;i<tli;++i) {
      this.pop();
    }
    this.numberOfItems = 0;
  },
  /*DOMString*/ initialize: function(/*DOMString*/ newItem ) {
    this.clear();
    this[0] = newItem;
    this.numberOfItems = 1;
    return newItem;
  },
  /*DOMString*/ getItem: function(/*unsigned long*/ index ) {
    if (index >= this.numberOfItems || index < 0) {
      throw (new DOMException(/*DOMException.INDEX_SIZE_ERR*/ 1));
    } else {
      return (this[index]);
    }
  },
  /*DOMString*/ insertItemBefore: function(/*DOMString*/ newItem, /*unsigned long*/ index ){
    if (index >= this.numberOfItems) {
      this.appendItem(newItem);
    } else {
      this.splice(index, 1, newItem, this.getItem(index));
      ++this.numberOfItems;
    }
    return newItem;
  },
  /*DOMString*/ replaceItem: function(/*DOMString*/ newItem, /*unsigned long*/ index ){
    if (index >= this.numberOfItems || index < 0) {
      throw (new DOMException(/*DOMException.INDEX_SIZE_ERR*/ 1));
    } else {
      this.splice(index, 1, newItem);
    }
    return newItem;
  },
                  //raises( DOMException, SVGException );
  /*DOMString*/ removeItem: function(/*unsigned long*/ index ){
    if (index >= this.numberOfItems || index < 0) {
      throw (new DOMException(/*DOMException.INDEX_SIZE_ERR*/ 1));
    } else {
      this.splice(index, 1);
      --this.numberOfItems;
    }
    return newItem;
  },
  /*DOMString*/ appendItem: function(/*DOMString*/ newItem ){
    this[this.numberOfItems] = newItem;
    ++this.numberOfItems;
  }
} )
 .mix( function() { 
   this.up("$SVGNumberList");
   this.up("$SVGLengthList");
   this.up("$SVGPointList");
   this.up("$SVGTransformList");
   this.up("$SVGPathSegList");
 } );

(function() {
var obj =  {
  /*unsigned short*/ baseVal: 0,
                         // raises DOMException on setting
  /*readonly unsigned short*/ animVal: 0
};
base("$SVGAnimatedEnumeration").mix(obj);
base("$SVGAnimatedInteger").mix(obj);
base("$SVGAnimatedNumber").mix(obj);
obj = void 0;
})();

base("$SVGNumber") 
  /*float*/ .value = 0;
                         // raises DOMException on setting

/*SVGUnmberListのメソッドはSVGStringListを参照*/

function SVGAnimatedNumberList() {
  /*readonly SVGNumberList*/ this.animVal = this.baseVal = base("$SVGStringList").$SVGNumberList.up();
};
/*$SVGLengthオブジェクト
 *長さを設定する（単位pxに統一する方便として使う）
 *valueInSpecifiedUnitsプロパティはpxに統一する前の数値。valueプロパティはpxに統一した後の数値
 */
base("$SVGLength").mix( {
/*(function(t) {
    // Length Unit Types
  /*const unsigned short t.SVG_LENGTHTYPE_UNKNOWN    = 0;
  /*const unsigned short t.SVG_LENGTHTYPE_NUMBER     = 1;
  /*const unsigned short t.SVG_LENGTHTYPE_PERCENTAGE = 2;
  /*const unsigned short t.SVG_LENGTHTYPE_EMS        = 3;
  /*const unsigned short t.SVG_LENGTHTYPE_EXS        = 4;
  /*const unsigned short t.SVG_LENGTHTYPE_PX         = 5;
  /*const unsigned short t.SVG_LENGTHTYPE_CM         = 6;
  /*const unsigned short t.SVG_LENGTHTYPE_MM         = 7;
  /*const unsigned short t.SVG_LENGTHTYPE_IN         = 8;
  /*const unsigned short t.SVG_LENGTHTYPE_PT         = 9;
  /*const unsigned short t.SVG_LENGTHTYPE_PC         = 10;
})(SVGLength);*/


  /*readonly attribute unsigned short*/ unitType : /*SVGLength.SVG_LENGTHTYPE_UNKNOWN*/ 0,
  /*attribute float*/          value : 0,                  //利用単位における値
  /*attribute float*/          valueInSpecifiedUnits : /*SVGLength.SVG_LENGTHTYPE_UNKNOWN*/ 0,  //unitTypeにおける値
  /*attribute DOMString*/      valueAsString : "0",
  _percent : 0.01, //単位に%が使われていた場合、このプロパティの数値を1%として使う
  _fontSize : 12, //単位のemとexで使われるfont-sizeの値
/*newValueSpedifiedUnitsメソッド
 *新しくunitTypeにおける値を設定する
 *例:2ｐｘならば、x.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 2);となる
 */
  newValueSpecifiedUnits : function (/*unsigned short*/ unitType, /*float*/ valueInSpecifiedUnits) {
    var n = 1,
       _s = ""; //nは各単位から利用単位への変換数値。_sは単位の文字列を表す
    if (unitType === /*SVGLength.SVG_LENGTHTYPE_NUMBER*/ 1) {
    } else if (unitType === /*SVGLength.SVG_LENGTHTYPE_PX*/ 5) {
      _s = "px";
    } else if (unitType === /*SVGLength.SVG_LENGTHTYPE_PERCENTAGE*/ 2) {
      n = this._percent;
      _s = "%";
    } else if (unitType === /*SVGLength.SVG_LENGTHTYPE_EMS*/ 3) {
      n = this._fontSize;
      _s = "em";
    } else if (unitType === /*SVGLength.SVG_LENGTHTYPE_EXS*/ 4) {
      n = this._fontSize * 0.5;
      _s = "ex";
    } else if (unitType === /*SVGLength.SVG_LENGTHTYPE_CM*/ 6) {
      n = 35.43307;
      _s = "cm";
    } else if (unitType === /*SVGLength.SVG_LENGTHTYPE_MM*/ 7) {
      n = 3.543307;
      _s = "mm";
    } else if (unitType === /*SVGLength.SVG_LENGTHTYPE_IN*/ 8) {
      n = 90;
      _s = "in";
    } else if (unitType === /*SVGLength.SVG_LENGTHTYPE_PT*/ 9) {
      n = 1.25;
      _s = "pt";
    } else if (unitType === /*SVGLength.SVG_LENGTHTYPE_PC*/ 10) {
      n = 15;
      _s = "pc";
    } else {
      throw new DOMException(/*DOMException.NOT_SUPPORTED_ERR*/ 9);
    }
    this.unitType = unitType;
    this.value = valueInSpecifiedUnits * n;
    this.valueInSpecifiedUnits = valueInSpecifiedUnits;
    this.valueAsString = valueInSpecifiedUnits + _s;
    valueInSpecifiedUnits = unitType = n = _s = void 0;
  },
/*convertToSpecifiedUnitsメソッド
 *valueプロパティを書き換えずに、単位だけを変換する
 *例：2cmをmmに変換したい場合
 * x.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_CM, 2);
 * x.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_MM);
 * alert(x.valueAsString); //20mm
 */
  convertToSpecifiedUnits : function (/*unsigned short*/ unitType) {
    if (this.value === 0) {
      this.newValueSpecifiedUnits(unitType, 0);
      return;
    }
    var v = this.value;
    this.newValueSpecifiedUnits(unitType, this.valueInSpecifiedUnits);
    v = v / this.value * this.valueInSpecifiedUnits;
    this.newValueSpecifiedUnits(unitType, v);
  },
  /*_emToUnitメソッド
   *emやexが単位に使われていたときに、@fontSizeの値を手がかりに、新たな値へとvalueを変換させる
   *単位が%の場合は、新しいvalueへと変換させておく
   */
  _emToUnit : function (/*float*/ fontSize) {
    if ((this.unitType === /*SVGLength.SVG_LENGTHTYPE_EMS*/ 3) || (this.unitType === 4)) {
      this._fontSize = fontSize;
      this.newValueSpecifiedUnits(this.unitType, this.valueInSpecifiedUnits);
    }
  }
} );
function SVGAnimatedLength() {
  /*readonly SVGLength*/ this.animVal;
  this.baseVal = base("$SVGLength").up();
  this.baseVal.unitType = 1;
};

/*SVGLengthListのメソッドはSVGStringListを参照*/

function SVGAnimatedLengthList() {
  /*readonly SVGLengthList*/ this.animVal = this.baseVal = base("$SVGStringList").$SVGLengthList.up();;
};

base("$SVGAngle").mix( {
  /*readonly attribute unsigned short*/ unitType : 0,
  /*attribute float*/     value : 0,
                         // raises DOMException on setting
  /*attribute float*/     valueInSpecifiedUnits : 0,
                         // raises DOMException on setting
  /*attribute DOMString*/ valueAsString : "0",
                         // raises DOMException on setting
  /*void*/ newValueSpecifiedUnits : function (/*in unsigned short*/ unitType, /*in float*/ valueInSpecifiedUnits ) {
    var n = 1,
        _s = ""; //nは各単位から度への変換数値。_sは単位の文字列を表す
    if (unitType === /*SVGAngle.SVG_ANGLETYPE_UNSPECIFIED*/ 1) {
    } else if (unitType === /*SVGAngle.SVG_ANGLETYPE_DEG*/ 2) {
      _s = "deg";
    } else if (unitType === /*SVGAngle.SVG_ANGLETYPE_RAD*/ 3) {
      n = Math.PI / 180;
      _s = "rad";
    } else if (unitType === /*SVGAngle.SVG_ANGLETYPE_GRAD*/ 4) {
      n = 9 / 10;
      _s = "grad";
    } else {
      throw new DOMException(/*DOMException.NOT_SUPPORTED_ERR*/ 9);
    }
    this.unitType = unitType;
    this.value = valueInSpecifiedUnits * n;
    this.valueInSpecifiedUnits = valueInSpecifiedUnits;
    this.valueAsString = valueInSpecifiedUnits + _s;
    n = _s = void 0;
    //raises( DOMException );
  },
  /*void*/ convertToSpecifiedUnits : function (/*in unsigned short*/ unitType ) {
    if (this.value === 0) {
      this.newValueSpecifiedUnits(unitType, 0);
      return;
    }
    var v = this.value;
    this.newValueSpecifiedUnits(unitType, this.valueInSpecifiedUnits);
    v = v / this.value * this.valueInSpecifiedUnits;
    this.newValueSpecifiedUnits(unitType, v);
    //raises( DOMException );
  }
} );
// Angle Unit Types
/*const unsigned short SVGAngle.SVG_ANGLETYPE_UNKNOWN     = 0;
/*const unsigned short SVGAngle.SVG_ANGLETYPE_UNSPECIFIED = 1;
/*const unsigned short SVGAngle.SVG_ANGLETYPE_DEG         = 2;
/*const unsigned short SVGAngle.SVG_ANGLETYPE_RAD         = 3;
/*const unsigned short SVGAngle.SVG_ANGLETYPE_GRAD        = 4;*/
function SVGAnimatedAngle() {
  /*readonly attribute SVGAngle*/ this.baseVal = base("$SVGAngle").up();
  /*readonly attribute SVGAngle*/ this.animVal = base("$SVGAngle").up();
};

base("$CSSValue").up("$SVGColor").mix( {
  _new$: function() {
    /*readonly css::RGBColor*/  this.up().rgbColor  = new RGBColor();
    return this.$1;
  },
  // Color Types
/*unsigned short SVGColor.SVG_COLORTYPE_UNKNOWN           = 0;
/*unsigned short SVGColor.SVG_COLORTYPE_RGBCOLOR          = 1;
/*unsigned short SVGColor.SVG_COLORTYPE_RGBCOLOR_ICCCOLOR = 2;
/*unsigned short SVGColor.SVG_COLORTYPE_CURRENTCOLOR      = 3;*/
  /*readonly unsigned short*/ colorType: /*SVGColor.SVG_COLORTYPE_UNKNOWN*/ 0,
  /*readonly SVGICCColor*/    iccColor: null,
  _regD: /\d+/g,
  _regDP: /[\d.]+%/g,
  _exceptionsvg: /*SVGException.SVG_INVALID_VALUE_ERR*/ 1,
  /*void*/ setRGBColor: function(/*DOMString*/ rgbColor ){
  var s,
      _parseInt,
      r, g, b;
  if (!rgbColor || (typeof rgbColor !== "string")) {
    throw new SVGException(this._exceptionsvg);
  }
  s = this._keywords[rgbColor];
  if (s) {
  } else if (rgbColor.indexOf("%", 5) > 0) {      // %を含むrgb形式の場合
    rgbColor = rgbColor.replace(this._regDP, function(s) {
      return Math.round((2.55 * parseFloat(s)));
    });
    s = rgbColor.match(this._regD);
  } else if (rgbColor.indexOf("#") === 0) {  //#を含む場合
    s = [];
    _parseInt = parseInt;
    if (rgbColor.length < 5) {
      r = rgbColor.charAt(1);
      g = rgbColor.charAt(2);
      b = rgbColor.charAt(3);
      rgbColor = "#" + r + r + g + g + b + b;
    }
    s[0] = _parseInt(rgbColor.slice(1, 3), 16)+ "";
    s[1] = _parseInt(rgbColor.slice(3, 5), 16)+ "";
    s[2] = _parseInt(rgbColor.slice(5, 7), 16)+ "";
    r = g = b = void 0;
  } else {
    s = rgbColor.match(this._regD);
    if (!s || (s.length < 3)) { //数値が含まれていなければ強制的に終了
      rgbColor = void 0;
      throw new SVGException(this._exceptionsvg);
    }
  }
  rgbColor = this.rgbColor;
  rgbColor.red.setFloatValue(/*CSSPrimitiveValue.CSS_NUMBER*/ 1, s[0]);
  rgbColor.green.setFloatValue(1, s[1]);
  rgbColor.blue.setFloatValue(1, s[2]);
  rgbColor = s = _parseInt = void 0;
},

//                    raises( SVGException );
/*void*/ setColor: function(/*unsigned short*/ colorType, /*DOMString*/ rgbColor, /*DOMString*/ iccColor ){
  this.colorType = colorType;
  if ((colorType === /*SVGColor.SVG_COLORTYPE_RGBCOLOR*/ 1) && iccColor) {
    throw new SVGException(this._exceptionsvg);
  } else if (colorType === /*SVGColor.SVG_COLORTYPE_RGBCOLOR*/ 1) {
    this.setRGBColor(rgbColor);
  } else if (rgbColor && (colorType === /*SVGColor.SVG_COLORTYPE_CURRENTCOLOR*/ 3)) {
    this.setRGBColor(rgbColor);
  } else if ((colorType === /*SVGColor.SVG_COLORTYPE_UNKNOWN*/ 0) && (rgbColor || iccColor)) {
    throw new SVGException(this._exceptionsvg);
  } else if ((colorType === /*SVGColor.SVG_COLORTYPE_RGBCOLOR_ICCCOLOR*/ 2) && (rgbColor || !iccColor)) {
    throw new SVGException(this._exceptionsvg);
  }
  colorType = rgbColor = void 0;
},
//                    raises( SVGException );
//色キーワード
_keywords: {
    aliceblue:    [240,248,255],
    antiquewhite: [250,235,215],
    aqua:         [0,255,255],
    aquamarine:   [127,255,212],
    azure:        [240,255,255],
    beige:        [245,245,220],
    bisque:       [255,228,196],
    black:        [0,0,0],
    blanchedalmond:[255,235,205],
    blue:         [0,0,255],
    blueviolet:   [138,43,226],
    brown:        [165,42,42],
    burlywood:    [222,184,135],
    cadetblue:    [95,158,160],
    chartreuse:   [127,255,0],
    chocolate:    [210,105,30],
    coral:        [255,127,80],
    cornflowerblue:[100,149,237],
    cornsilk:     [255,248,220],
    crimson:      [220,20,60],
    cyan:         [0,255,255],
    darkblue:     [0,0,139],
    darkcyan:     [0,139,139],
    darkgoldenrod:[184,134,11],
    darkgray:     [169,169,169],
    darkgreen:    [0,100,0],
    darkgrey:     [169,169,169],
    darkkhaki:    [189,183,107],
    darkmagenta:  [139,0,139],
    darkolivegreen:[85,107,47],
    darkorange:    [255,140,0],
    darkorchid:   [153,50,204],
    darkred:      [139,0,0],
    darksalmon:   [233,150,122],
    darkseagreen: [143,188,143],
    darkslateblue:[72,61,139],
    darkslategray:[47,79,79],
    darkslategrey:[47,79,79],
    darkturquoise:[0,206,209],
    darkviolet:   [148,0,211],
    deeppink:     [255,20,147],
    deepskyblue:  [0,191,255],
    dimgray:      [105,105,105],
    dimgrey:      [105,105,105],
    dodgerblue:   [30,144,255],
    firebrick:    [178,34,34],
    floralwhite:  [255,250,240],
    forestgreen:  [34,139,34],
    fuchsia:      [255,0,255],
    gainsboro:    [220,220,220],
    ghostwhite:   [248,248,255],
    gold:         [255,215,0],
    goldenrod:    [218,165,32],
    gray:         [128,128,128],
    grey:         [128,128,128],
    green:        [0,128,0],
    greenyellow:  [173,255,47],
    honeydew:     [240,255,240],
    hotpink:      [255,105,180],
    indianred:    [205,92,92],
    indigo:       [75,0,130],
    ivory:        [255,255,240],
    khaki:        [240,230,140],
    lavender:     [230,230,250],
    lavenderblush:[255,240,245],
    lawngreen:    [124,252,0],
    lemonchiffon: [255,250,205],
    lightblue:    [173,216,230],
    lightcoral:   [240,128,128],
    lightcyan:    [224,255,255],
    lightgoldenrodyellow:[250,250,210],
    lightgray:    [211,211,211],
    lightgreen:   [144,238,144],
    lightgrey:    [211,211,211],
    lightpink:    [255,182,193],
    lightsalmon:  [255,160,122],
    lightseagree: [32,178,170],
    lightskyblue: [135,206,250],
    lightslategray:[119,136,153],
    lightslategrey:[119,136,153],
    lightsteelblue:[176,196,222],
    lightyellow:  [255,255,224],
    lime:         [0,255,0],
    limegreen:    [50,205,50],
    linen:        [250,240,230],
    magenta:      [255,0,255],
    maroon:       [128,0,0],
    mediumaquamarine:[102,205,170],
    mediumblue:    [0,0,205],
    mediumorchid:  [186,85,211],
    mediumpurple:  [147,112,219],
    mediumseagreen:[60,179,113],
    mediumslateblue:[123,104,238],
    mediumspringgreen:[0,250,154],
    mediumturquoise:[72,209,204],
    mediumvioletred:[199,21,133],
    midnightblue:  [25,25,112],
    mintcream:     [245,255,250],
    mistyrose:     [255,228,225],
    moccasin:      [255,228,181],
    navajowhite:   [255,222,173],
    navy:          [0,0,128],
    oldlace:       [253,245,230],
    olive:         [128,128,0],
    olivedrab:     [107,142,35],
    orange:        [255,165,0],
    orangered:     [255,69,0],
    orchid:        [218,112,214],
    palegoldenrod: [238,232,170],
    palegreen:     [152,251,152],
    paleturquoise: [175,238,238],
    palevioletred: [219,112,147],
    papayawhip:    [255,239,213],
    peachpuff:     [255,218,185],
    peru:          [205,133,63],
    pink:          [255,192,203],
    plum:          [221,160,221],
    powderblue:    [176,224,230],
    purple:        [128,0,128],
    red:           [255,0,0],
    rosybrown:     [188,143,143],
    royalblue:     [65,105,225],
    saddlebrown:   [139,69,19],
    salmon:        [250,128,114],
    sandybrown:    [244,164,96],
    seagreen:      [46,139,87],
    seashell:      [255,245,238],
    sienna:        [160,82,45],
    silver:        [192,192,192],
    skyblue:       [135,206,235],
    slateblue:     [106,90,205],
    slategray:     [112,128,144],
    slategrey:     [112,128,144],
    snow:          [255,250,250],
    springgreen:   [0,255,127],
    steelblue:     [70,130,180],
    tan:           [210,180,140],
    teal:          [0,128,128],
    thistle:       [216,191,216],
    tomato:        [255,99,71],
    turquoise:     [64,224,208],
    violet:        [238,130,238],
    wheat:         [245,222,179],
    white:         [255,255,255],
    whitesmoke:    [245,245,245],
    yellow:        [255,255,0],
    yellowgreen:   [154,205,50]
}
} );

base("$SVGRect").mix( {
  /*float*/ x: 0,
                         // raises DOMException on setting
  /*float*/ y: 0,
                         // raises DOMException on setting
  /*float*/ width: 0,
                         // raises DOMException on setting
  /*float*/ height: 0
                         // raises DOMException on setting
} );

function SVGAnimatedRect() {
  /*readonly SVGRect*/ this.baseVal = base("$SVGRect").up();
/*readonly SVGRect*/ this.animVal  = base("$SVGRect").up();
};

/*SVGUnitTypes = {
  // Unit Types
  /*unsigned short SVG_UNIT_TYPE_UNKNOWN           : 0,
  /*unsigned short SVG_UNIT_TYPE_USERSPACEONUSE    : 1,
  /*unsigned short SVG_UNIT_TYPE_OBJECTBOUNDINGBOX : 2
};*/
function SVGStylable() {
  /*readonly attribute SVGAnimatedString*/ this.className = base("$SVGAnimatedString").up();
  ElementCSSInlineStyle.call(this);
};
/*getPresentationAttributeメソッド
 *プレゼンテーション属性の値をCSSValueとして得る。これはCSSのスタイルの設定値を定めるときや、内部の動的処理に役立つ
 */
/*css::CSSValue*/base("$document").$element.$svgelement.getPresentationAttribute = function( /*DOMString*/ name ){
  var s = this._attributeStyle.getPropertyCSSValue(name);
  if (s) {
    return s;
  } else {
    return null;
  }
};

/*SVGURIReferenceオブジェクトはURI参照を用いる要素に適用される
 *SIEでは、もっぱらXLink言語の処理を行う
 */
function SVGURIReference() {
  /*readonly SVGAnimatedString*/ this.href = base("$SVGAnimatedString").up();
  this._instance = null; //埋め込みの場合に、読み込んだDOMツリーを結び付けておくプロパティ
  this._text = "";
  this.addEventListener("DOMAttrModified", function(evt){
    if ((evt.relatedNode.namespaceURI === "http://www.w3.org/1999/xlink") && (evt.attrName === "xlink:href")) {
      evt.target.href.baseVal = evt.newValue;
      /*_svgload_limitedを+1とすることで、
       *SVGLoadイベントは発火されなくなる。1を引く必要がある
       */
      evt.target.ownerDocument.documentElement._svgload_limited++;
    }
    evt = void 0;
  }, false);
  this.addEventListener("DOMNodeInserted", function(evt){
    var tar = evt.target;
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
      var tar = evt.target,
          base = location.href,
          href = tar.href.baseVal,
          doc = tar.ownerDocument,
          durl = doc.URL,
          reg = /\.+\//g,
          regg = /\/[^\/]+?(\/[^\/]*?)$/,
          fe, show, egbase, ep, b, uri, xmlhttp, ui, id, ele, ev, Sfunc;
      /*xlink:href属性とxml:base属性を手がかりに、
       *ハイパーリンクのURIを決定する処理を行う
       */
      if (href !== "") { //xlink:href属性が指定されたとき
        egbase = tar.xmlbase;
        if (!egbase) {
          ep = tar.parentNode;
          b = null;
          while (!b && ep) {
            b = ep.xmlbase;
            ep = ep.parentNode;
          }
          egbase = b;
        }
        fe = function(durl, base) {
          if (href.indexOf(":") > -1) { //絶対URIの場合
            uri =  href;
          } else if (durl.indexOf(":") > -1) {
            base = durl;
          } else {
            /*durlが相対URLの場合はdirecoryの名前を消す*/
            reg.lastIndex = 0; // execメソッドを使うため
            while (reg.exec(durl)) {
              base = base.replace(regg, "$1");
            }
            base = base.replace(/\/[^\/]+?$/, "/"); //URIの最後尾にあるファイル名は消す。例: /n/sie.js -> /n/
            base = base + durl.replace(reg, "");
          }
          return base;
        };
        base = fe(durl, base);
        if (egbase) {
          base = fe(egbase, base);    //xml:base属性の指定がある場合
        }
        if (href.indexOf("#") === 0) { //href属性において#が一番につく場合
          uri = href;
        } else if (!uri){
          base = base.replace(/\/[^\/]+?$/, "/");
          reg.lastIndex = 0; // execメソッドを使うため
          while (reg.exec(href)) {
           base = base.replace(regg, "$1");
          }
          uri = base + href.replace(reg, "");
        }
        show = tar.getAttributeNS("http://www.w3.org/1999/xlink", "show") || "embed";
        if (show === "replace") {
          tar._tar.setAttribute("href", uri);
        } else if (show === "new") {
          tar._tar.setAttribute("target", "_blank");
          tar._tar.setAttribute("href", uri);
        } else if (show === "embed") {
          xmlhttp = NAIBU.xmlhttp;
          ui = uri.indexOf("#");
          if (ui > -1) {
            id = uri.slice(ui+1);
            uri = uri.replace(/#.+$/, "");
          } else {
            id = null;
          }
          if (href.indexOf("#") === 0) { //URIが#で始まるのであれば
            ele = doc.getElementById(id);
            tar._instance = ele;
            Sfunc = SVGURIReference;
            SVGURIReference = function(){};
            ev = doc.createEvent("SVGEvents");
            ev.initEvent("S_Load", false, false);
            tar.dispatchEvent(ev);
            SVGURIReference = Sfunc;
            xmlhttp = void 0;
          } else if (uri.indexOf("data:") > -1) {
            tar._tar.src = uri;
            xmlhttp = void 0;
          } else if ((uri.indexOf("http:") > -1)){
            if ((tar.localName === "image") && (uri.indexOf(".svg") === -1)) {
              tar._tar.src = uri;
            } else {
              /*ここの_svgload_limitedは、リンクを読み込んだ後でSVGLoadイベントを実行させるという遅延処理で必要*/
              tar.ownerDocument.documentElement._svgload_limited++;
              xmlhttp.open("GET", uri, false);
              xmlhttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
              xmlhttp.onreadystatechange = function() {
                if ((xmlhttp.readyState === 4) && (xmlhttp.status === 200)) {
                  var type = xmlhttp.getResponseHeader('Content-Type') || "text",
                      doc, str, ele, ev, ndoc, Sfunc;
                  if ((type.indexOf("text") > -1) || (type.indexOf("xml") > -1) || (type.indexOf("script") > -1)) { //ファイルがtext形式である場合
                    /*responseXMLを使うと、時々、空のデータを返すことがあるため（原因はcontent-typeが"text/xml"など特定のものでないと受け付けないため）、
                     *ここでは、responseTextを用いる
                     */
                    /*script要素とstyle要素は、
                     *_textプロパティに読み込んだテキストを格納しておく
                     *それら以外は、_instanceプロパティにDOMツリーを格納しておく
                     */
                    if (tar.localName !== "script" && tar.localName !== "style") {
                      try {
                        doc = new ActiveXObject("MSXML2.DomDocument");
                        str = xmlhttp.responseText.replace(/!DOCTYPE/,"!--").replace(/(dtd">|\]>)/,"-->");
                        ndoc = NAIBU.doc;
                        ndoc.async = ndoc.validateOnParse = ndoc.resolveExternals = ndoc.preserveWhiteSpace = false;
                        doc.loadXML(str);
                        ele = doc.documentElement;
                        Sfunc = SVGURIReference;
                        SVGURIReference = function(){};
                        tar._instance = tar.ownerDocument.importNode(ele, true);
                        SVGURIReference = Sfunc;
                        if (id) {
                          tar._instance = tar._instance.ownerDocument.getElementById(id);
                        }
                      } catch (e) {}
                    } else {
                      tar._text = xmlhttp.responseText;
                    }
                  } else if (!!tar._tar) {
                    tar._tar.src = uri;
                  }
                  /*S_LoadイベントとはSIE独自のイベント。
                   *XLink言語によって、リンク先のコンテンツが読み込まれた時点で発火する
                   */
                  ev = tar.ownerDocument.createEvent("SVGEvents");
                  ev.initEvent("S_Load", false, false);
                  tar.dispatchEvent(ev);
                  tar.ownerDocument.documentElement._svgload_limited--;
                  /*すべてのリンクが読み込みを終了した場合、SVGLoadイベントを発火*/
                  if (tar.ownerDocument.documentElement._svgload_limited < 0) {
                    ev = tar.ownerDocument.createEvent("SVGEvents");
                    ev.initEvent("SVGLoad", false, false);
                    tar.ownerDocument.documentElement.dispatchEvent(ev);
                  }
                  type = doc = str = ev = Sfunc = ndoc = void 0;
                  /*IEのメモリリーク対策として、空関数を入力*/
                  xmlhttp.onreadystatechange = NAIBU.emptyFunction;
                  xmlhttp = void 0;
                }
              };
              xmlhttp.send(null);
            }
          }
        }
        tar.ownerDocument.documentElement._svgload_limited--;
        tar = void 0;
      }
      evt = base = href = egbase = fe = ep = durl = b = reg = uri = ui = id = doc = ele = ev = show = Sfunc = void 0;
    }, false);
    tar = evt = void 0;
  }, false);
};
base("$CSSStyleRule").up("$SVGCSSRule").mix( {
  // Additional CSS RuleType to support ICC color specifications
  /*const unsigned short*/ COLOR_PROFILE_RULE: 7
} );

/*SVGDocument
 *SVGの文書オブジェクトについては、DOMImplementationのcreateDocumentメソッドを上書きすることで実現
 */
base("DOMImplementation").mix ( function(_) {
_._createDocument = _.createDocument;
_.createDocument = function() {
  return this._createDocument.apply(this, arguments).mix(function() {
    base("$StyleSheet").DocumentStyle.call(this);
    SVGStylable.call(this);
    /*readonly DOMString*/     this.title    = "";
    /*readonly DOMString*/     this.referrer = document.referrer;
    /*readonly DOMString*/     this.domain   = document.domain;
    /*readonly DOMString*/     this.URL      = location.href;
    /*readonly SVGSVGElement*/ this.rootElement;
    /*軽量化のために、頻繁に使われる処理をSVGDocumentの独自メソッドとしてまとめておく*/
    this._domnodeEvent = function() {
      var evtt = this.createEvent("MutationEvents");
      evtt.initMutationEvent("DOMNodeInsertedIntoDocument", false, false, null, null, null, null, null);
      return evtt;
    };
    this._document_ = this._doc_ || document; //_doc_プロパティに関しては、GetSVGDocumentの_caメソッドを参照
    /*base.jsを使ったメソッドのオーバライドによって、SVG関連のオブジェクトを呼び出せるようにする*/
    this.createElementNS = function(ns, name) {
      var t$e = this.$element,
           tes;
      if (ns === "http://www.w3.org/2000/svg") {
        /*本来はmixメソッドを使うべきところを、高速化のために、$elementプロパティを書き換える*/
        tes = t$e.$svgelement;
        name = (name.indexOf(":") !== -1) ? name.split(":")[1] : name; //prefixは削除
        this.$element = tes[ns+name] || tes;
      }
      var s = this.$document.createElementNS.apply(this, arguments);
      s._capter = [];                         //イベント処理で使う
      this.$element = t$e;
      s.initialize && s.initialize(this._document_);
      t$e = tes = void 0;
      return s;
    };
    /*documentElementプロパティの上書き*/
    var tde = this.documentElement;
    this.documentElement = this.createElementNS(tde.namespaceURI, tde.nodeName);
    tde = void 0;
  });
};
} );

/*$svg
 *svg要素をあらわすオブジェクト
 */
base("$document").$element.$svgelement.upsvg("svg").on("initialize",  function (_doc) {
  _doc && (this._tar = _doc.createElement("v:group"));
  _doc = void 0;
  /*_svgload_limitedはSVGLoadイベントを発火させる判定基準。
   * Xlink言語が使われていない限り0であり、SVGLoadイベントが発火される*/
  this._svgload_limited = 0;
/*                SVGElement,
                SVGTests,
                SVGLangSpace,
                SVGExternalResourcesRequired,
                SVGStylable,
                SVGLocatable,
                SVGFitToViewBox,
                SVGZoomAndPan,
                events::EventTarget,
                events::DocumentEvent,
                css::ViewCSS,
                css::DocumentCSS {*/
  /*以下のx,y,width,heightプロパティは
   *それぞれ、svg要素の同名属性に対応。たとえば、xならば、x属性に対応している
   */
  var slen = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/ this.x      = new slen();
  /*readonly SVGAnimatedLength*/ this.y      = new slen();
  /*readonly SVGAnimatedLength*/ this.width  = new slen();
  /*readonly SVGAnimatedLength*/ this.height = new slen();
  slen = void 0;
  /*DOMString*/                  this.contentScriptType = "application/ecmascript"; //古い仕様では、text/ecmascript
  /*DOMString*/                  this.contentStyleType  = "text/css";
  /*readonly SVGRect*/           this.viewport          = this.createSVGRect();
  /*useCurrentViewプロパティ
   * view要素やハイパーリンクなどで呼び出された場合、true。それ以外の通常表示はfalse。
   */
  /*boolean*/                    this.useCurrentView    = false;
  /*currentViewプロパティ
   * ズームやパンがされていない初期表示のviewBoxプロパティなどを示す。通常はDOM属性と連動
   */
  /*readonly SVGViewSpec*/       this.currentView       = new SVGViewSpec(this);
  /*もし、画像をズームやパンしたとき、どのような倍率になるかを
   *以下のプロパティを使って次の行列で示すことができる
   *2x3 行列 [a b c d e f] = [currentScale 0 0 currentScale currentTranslate.x currentTranslate.y]
   */
  /*float*/                      this.currentScale     = 1;
  /*readonly SVGPoint*/          this.currentTranslate = this.createSVGPoint();
  /*以下は、SVGFitToViewBoxのインターフェースを用いる
   *もし、ズームやパンがあれば、真っ先にこれらのプロパティを別のオブジェクトに変更すること
   */
  /*readonly SVGAnimatedRect*/   this.viewBox = this.currentView.viewBox;
  /*readonly SVGAnimatedPreserveAspectRatio*/ this.preserveAspectRatio = this.currentView.preserveAspectRatio;
  /*unsigned short*/             this.zoomAndPan = /*SVGZoomAndPan.SVG_ZOOMANDPAN_DISABLE*/ 1;
  this._tx = 0;
  this._ty = 0;
  /*int*/                       this._currentTime = 0;
  /*DOMAttrModifiedイベントを利用して、
   *随時、属性の値をDOMプロパティに変換しておくリスナー登録
   */
  this.addEventListener("DOMAttrModified", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target,
        name = evt.attrName,
        tv, ovb, par, tp, sa, mos;
    if (name === "viewBox") {
      tar._cacheScreenCTM = null;
      tv = tar.viewBox.baseVal;
      ovb = evt.newValue.replace(/^\s+|\s+$/g, "").split(/[\s,]+/);
      tv.x = parseFloat(ovb[0]);
      tv.y = parseFloat(ovb[1]);
      tv.width = parseFloat(ovb[2]);
      tv.height = parseFloat(ovb[3]);
      tar.viewBox.baseVal._isUsed = 1;
    } else if (name === "preserveAspectRatio") {
      tar._cacheScreenCTM = null;
      par = evt.newValue;
      tp = tar.preserveAspectRatio.baseVal;
      sa = 1;
      mos = /*SVGPreserveAspectRatio.SVG_MEETORSLICE_UNKNOWN*/ 0;
      if (!!par.match(/x(Min|Mid|Max)Y(Min|Mid|Max)(?:\s+(meet|slice))?/)) {
        switch (RegExp.$1) {
          case "Min":
            sa += 1;
          break;
          case "Mid":
            sa += 2;
          break;
          case "Max":
            sa += 3;
          break;
        }
        switch (RegExp.$2) {
          case "Min":
          break;
          case "Mid":
            sa += 3;
          break;
          case "Max":
            sa += 6;
          break;
        }
        if (RegExp.$3 === "slice") {
          mos = /*SVGPreserveAspectRatio.SVG_MEETORSLICE_SLICE*/ 2;
        } else {
          mos = /*SVGPreserveAspectRatio.SVG_MEETORSLICE_MEET*/ 1;
        }
      }
      tp.align = sa;
      tp.meetOrSlice = mos;
    } else if (name === "width") {
      /*viewportを更新する*/
      tar.viewport.width = tar.width.baseVal.value;
    } else if (name === "height") {
      tar.viewport.height = tar.height.baseVal.value;
    }
    evt = name = tv = ovb = par = tp = sa = mos = void 0;
  }, false);
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.AT_TARGET*/ 2) {
      var tar = evt.target;
      tar.addEventListener("DOMNodeInserted", function(evt){
        if (evt.eventPhase === 1) {
          evt.target.nearestViewportElement = tar;
        }
      }, true);
      /*getCTMメソッドの再定義で、viewBox属性やx,y属性などに対応*/
      tar._getCTM = tar.getCTM;
      tar.getCTM = function() {
        if (!this._cacheMatrix) {
          var m = this.getScreenCTM(),
              style = this.ownerDocument.defaultView.getComputedStyle(this, ""),
              fontSize = parseFloat(style.getPropertyValue("font-size"));
          this.x.baseVal._emToUnit(fontSize);
          this.y.baseVal._emToUnit(fontSize);
          m = m.translate(this.x.baseVal.value, this.y.baseVal.value);
          this._cacheMatrix = this._getCTM().multiply(m);
        }
        return (this._cacheMatrix);
      };
      tar._inserted__(tar);
      evt = tar.ownerDocument.createEvent("SVGEvents");
      evt.initEvent("SVGLoad", false, false);
      tar.dispatchEvent(evt);
      evt = void 0;
    }
  }, false);
  this.addEventListener("SVGLoad", function(evt){
    /*以下のDOMAttrModifiedは浮上フェーズのときに、再描画をするように
     *処理を書いたもの。属性が書き換わるたびに、再描画される
     */
    evt.target.addEventListener("DOMAttrModified", function(evt){
      var tar,
          evtt, tce, slist;
      if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
        tar = evt.target;
        if (tar.parentNode) {
          evtt = tar.ownerDocument._domnodeEvent();
          evtt.target = tar;
          evtt.eventPhase = /*Event.AT_TARGET*/ 2;
          tce = tar._capter; //tceは登録しておいたリスナーのリスト
          for (var j=0,tcli=tce.length;j<tcli;++j){
            if (tce[j]) {
              tce[j].handleEvent(evtt);
            }
          }
          if (((tar.localName === "g") || (tar.localName === "a")) && (tar.namespaceURI === "http://www.w3.org/2000/svg")) {
            tar._cacheMatrix = void 0; //キャッシュを消去
            if (tar.firstChild) {
              slist = tar.getElementsByTagNameNS("http://www.w3.org/2000/svg", "*");
              for (var i=0,sli=slist.length;i<sli;++i) {
                tar = slist[i];
                tar._cacheMatrix = void 0;
                evtt = tar.ownerDocument.createEvent("MutationEvents");
                evtt.initMutationEvent("DOMNodeInsertedIntoDocument", false, false, null, null, null, null, null);
                evtt.target = tar;
                evtt.eventPhase = /*Event.AT_TARGET*/ 2;
                tce = tar._capter; //tceは登録しておいたリスナーのリスト
                for (var j=0,tcli=tce.length;j<tcli;++j){
                  if (tce[j]) {
                    tce[j].handleEvent(evtt);
                  }
                }
              }
            }
          }
        }
      }
      evtt = tar = evt = tce = slist = void 0;
    }, false);
    evt.target.addEventListener("DOMNodeRemovedFromDocument", function(evt){
      var tar = evt.target;
      tar._tar && tar._tar.parentNode && tar._tar.parentNode.removeChild(tar._tar);
      evt = tar = void 0;
    }, true);
    evt = void 0;
  }, false);
}).mix({
/*void*/          forceRedraw: function() {
},
/*float*/         getCurrentTime: function(){
  return (this._currentTime);
},
/*void*/          setCurrentTime: function(/*float*/ seconds ){
  this._currentTime = seconds;
},
/*SVGNumber*/     createSVGNumber: function(){
  return base("$SVGNumber").up();
},
/*SVGAngle*/     createSVGAngle: function(){
  var s = base("$SVGAngle").up();
  s.unitType = 1;
  return s;
},
/*SVGLength*/     createSVGLength: function(){
  var s = base("$SVGLength").up();
  s.unitType = /*SVG_LENGTHTYPE_NUMBER*/ 1;
  return s;
},
/*SVGPoint*/      createSVGPoint: function(){
  return base("$SVGPoint").up();
},
/*SVGMatrix*/     createSVGMatrix: function(){
  //単位行列を作成
  return base("$SVGMatrix").up();
},
/*SVGRect*/       createSVGRect: function(){
  return base("$SVGRect").up();
},
/*SVGTransform*/  createSVGTransform: function(){
  var s = this.createSVGTransformFromMatrix(this.createSVGMatrix());
  return s;
},
/*SVGTransform*/  createSVGTransformFromMatrix: function(/*SVGMatrix*/ matrix ){
  var s = new SVGTransform();
  s.setMatrix(matrix);
  return s;
},
/*getScreenCTM
 *SVGElement(SVGLocatable)で指定しておいたメソッドであるが、ここで、算出方法が違うため、再定義をする
 */
/*SVGMatrix*/ getScreenCTM: function(){
  if (!!this._cacheScreenCTM) { //キャッシュがあれば
    return (this._cacheScreenCTM);
  }
  var vw = this.viewport.width,
      vh = this.viewport.height,
      vB, par, m, vbx, vby, vbw, vbh, rw, rh, xr, yr, tx, ty, ttps;
  if (!this.useCurrentView) {
    vB = this.viewBox.baseVal;
    par = this.preserveAspectRatio.baseVal;
  } else {
    vB = this.currentView.viewBox.baseVal;
    par = this.currentView.preserveAspectRatio.baseVal;
  }
  if (!!!vB._isUsed) { //viewBox属性が指定されていなければ
    this._tx = this._ty = 0;
    m = this.createSVGMatrix();
    this._cacheScreenCTM = m; //キャッシュを作っておく
    return m;
  } else {
    vbx = vB.x;
    vby = vB.y;
    vbw = vB.width;
    vbh = vB.height;
    rw = vw / vbw;
    rh = vh / vbh;
    xr = 1;
    yr = 1;
    tx = 0;
    ty = 0;
    if (par.align === 1) { //none
      xr = rw;
      yr = rh;
      tx = -vbx * xr;
      ty = -vby * yr;
    } else {
      var ax = (par.align + 1) % 3 + 1;
      var ay = Math.round(par.align / 3);
      switch (par.meetOrSlice) {
        case 1: //meet
          xr = yr = Math.min(rw, rh);
        break;
        case 2: //slice
          xr = yr = Math.max(rw, rh);
        break;
      }
      tx = -vbx * xr;
      ty = -vby * yr;
      switch (ax) {
        case 1: //xMin
        break;
        case 2: //xMid
          tx += (vw - vbw * xr) / 2;
        break;
        case 3: //xMax
          tx += vw - vbw * xr;
        break;
      }
      switch (ay) {
        case 1: //YMin
        break;
        case 2: //YMid
          ty += (vh - vbh * yr) / 2;
        break;
        case 3: //YMax
          ty += vh - vbh * yr;
        break;
      }
    }
  }
  //text要素の位置調整に使うため、ここで、viewの移動量を記録しておく
  //kares
  this._tx = 0;
  this._ty = 0;
  ttps =  this._tar.style;
  //kares
  //ttps.marginLeft = tx+ "px";
  //ttps.marginTop = ty+ "px";
  m = this.createSVGMatrix();
  m.a = xr;
  m.d = yr;
  this._cacheScreenCTM = m; //キャッシュを作っておく
  vw = vh = vB = par = vbx = vby = vbw = vbh = rw = rh = xr = yr = tx = ty = ttps = void 0;
  return m;
}
});

  /*interface SVGZoomAndPan*/
  // Zoom and Pan Types
/*SVGZoomAndPan = {
  /*const unsigned short SVG_ZOOMANDPAN_UNKNOWN : 0,
  /*const unsigned short SVG_ZOOMANDPAN_DISABLE : 1,
  /*const unsigned short SVG_ZOOMANDPAN_MAGNIFY : 2
};*/

function SVGFitToViewBox() {
  /*readonly SVGAnimatedRect*/ this.viewBox = new SVGAnimatedRect();
  /*readonly SVGAnimatedPreserveAspectRatio*/ this.preserveAspectRatio = new SVGAnimatedPreserveAspectRatio();
};
function SVGViewSpec(ele) {
  SVGFitToViewBox.call(this, ele);
  /*readonly SVGTransformList*/ this.transform = base("$SVGStringList").$SVGTransformList.up();
  /*readonly SVGElement*/       this.viewTarget = ele;
  /*readonly DOMString*/        this.viewBoxString = this.preserveAspectRatioString = this.transformString = this.viewTargetString = "";
};

base.$1.upsvg("g")
 .on("initialize",  function (_doc) {
  this._tar = _doc.createElement("v:group");
  _doc = void 0;
  /*以下の処理は、この子要素ノードがDOMツリーに追加されて初めて、
   *描画が開始されることを示す。つまり、appendChildで挿入されない限り、描画をしない。
   */
  this.addEventListener("DOMNodeInserted", function(evt){
    var tar = evt.target;
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tnext = tar.nextSibling,
        sar = tar._tar,
        spar = tar.parentNode._tar,
        snext = null;
    if (sar && spar) {
      if (!tnext) {
        spar.appendChild(sar);
      } else {
        while(tnext) {
          if (tnext._tar && tnext._tar.parentNode) {
            /*use要素や実体参照は_tarプロパティをもっていないので、無視する*/
            snext = tnext._tar;
            break;
          }
          tnext = tnext.nextSibling;
        }
        snext && (spar = snext.parentNode);
        spar.insertBefore(sar, snext);
      }
    }
    tnext = sar = spar = snext = void 0;
  }, false);
} );

base.$1.upsvg("defs").on("initialize", function () {
  this.style.setProperty("display", "none");
} );

base.$1.upsvg("desc");

base.$1.upsvg("title").on("initialize", function () {
  this.addEventListener("DOMCharacterDataModified", function(evt){
    evt.target.ownerDocument.title = evt.target.firstChild.nodeValue;
  }, false);
} );

base.$1.upsvg("symbol");

base.$1.upsvg("use").initialize = function () {
  this["http://www.w3.org/2000/svgg"].initialize.apply(this, arguments);
  var slen = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/   this.x = new slen();           //use要素のx属性に対応（以下、同様）
  /*readonly SVGAnimatedLength*/   this.y = new slen();
  /*readonly SVGAnimatedLength*/   this.width = new slen();
  /*readonly SVGAnimatedLength*/   this.height = new slen();
  slen = void 0;
  /*readonly SVGElementInstance*/ this.instanceRoot = this.up(); //参照先インスタンスのルート
  /*readonly SVGElementInstance*/ this.animatedInstanceRoot = this.up();//アニメの最中のインスタンス。静止中は通常
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    evt.target.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:show", "embed");
  }, false);
  this.addEventListener("S_Load", function(evt){
    var tar = evt.target,
        style = tar.ownerDocument.defaultView.getComputedStyle(tar, ""),
        fontSize = parseFloat(style.getPropertyValue("font-size")),
        trans = tar.ownerDocument.documentElement.createSVGTransform(),
        tari = tar._instance,
        svg, ti, ta, tn;
    tar.x.baseVal._emToUnit(fontSize);
    tar.y.baseVal._emToUnit(fontSize);
    tar.width.baseVal._emToUnit(fontSize);
    tar.height.baseVal._emToUnit(fontSize);
    tar.instanceRoot = tar.animatedInstanceRoot = tar.ownerDocument.importNode(tari, true);
    trans.setTranslate(tar.x.baseVal.value, tar.y.baseVal.value);
    tar.transform.baseVal.appendItem(trans);
    if (tar._instance.localName === "symbol") {
      /*symbol要素の場合、別途svg要素に置き換える*/
      svg = tar.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
        /*viewportをsymbol要素として新規に設定*/
        evt.target.nearestViewportElement = evt.currentTarget;
      }, true);
      tar._tar.appendChild(svg._tar);
      tn = tar.getScreenCTM();
      svg.setAttributeNS(null, "width", tar.width.baseVal.value);
      svg.setAttributeNS(null, "height", tar.height.baseVal.value);
      tari.hasAttributeNS(null, "viewBox") &&  svg.setAttributeNS(null, "viewBox", tari.getAttributeNS(null, "viewBox"));
      tari.hasAttributeNS(null, "preserveAspectRatio") &&  svg.setAttributeNS(null, "preserveAspectRatio", tari.getAttributeNS(null, "preserveAspectRatio"));
      svg._cacheScreenCTM = tn.multiply(svg.getScreenCTM());
      ti = tar.instanceRoot.firstChild;
      while (ti) {
        ta = ti.nextSibling;
        svg.appendChild(ti);
        ti.getScreenCTM && ti.getScreenCTM();
        ti = ta;
      }
      tar.appendChild(svg);
    } else {
      tar.appendChild(tar.instanceRoot);
    }
    evt = trans = tar = evtt = style = fontSize = svg = ti = ta = tn = void 0;
  }, false);
  SVGURIReference.apply(this);
};

/*function SVGElementInstance
  *Nodeオブジェクトを継承させる
  *SVGElementInstanceList*/

base.$1.upsvg("image")
 .on("initialize", function (_doc) {
  this._tar = _doc.createElement("v:image");
  //以下は、与えられた属性の値に対応する
  var slen = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/ this.x = new slen();
  /*readonly SVGAnimatedLength*/ this.y = new slen();
  /*readonly SVGAnimatedLength*/ this.width = new slen();
  /*readonly SVGAnimatedLength*/ this.height = new slen();
  _doc = slen = void 0;
  /*readonly SVGAnimatedPreserveAspectRatio*/ this.preserveAspectRatio = new SVGAnimatedPreserveAspectRatio();
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target;
    tar.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:show", "embed");
    if (tar.nextSibling) {
      if (!!tar.parentNode._tar && !!tar.nextSibling._tar) {
        tar.parentNode._tar.insertBefore(tar._tar, tar.nextSibling._tar);
      }
    } else if (!!tar.parentNode._tar){
      tar.parentNode._tar.appendChild(tar._tar);
    }
    tar.addEventListener("DOMNodeInsertedIntoDocument", tar._imageo, false);
    evt = tar = void 0;
  }, false);
  SVGURIReference.apply(this);
} )
/*_imageo関数は、SVGForeignObjectElementで再利用するので、切り離しておく*/
 ._imageo = function(evt) {
  var tar = evt.target,
      style = tar.ownerDocument.defaultView.getComputedStyle(tar, ""),
      fontSize = parseFloat(style.getPropertyValue("font-size")),
      ts = tar._tar.style,
      ctm = tar.getScreenCTM(),
      po = tar.ownerDocument.documentElement.createSVGPoint(),
      fillOpacity = parseFloat(style.getPropertyValue("fill-opacity")),
      ttfia;
  tar.x.baseVal._emToUnit(fontSize);
  tar.y.baseVal._emToUnit(fontSize);
  tar.width.baseVal._emToUnit(fontSize);
  tar.height.baseVal._emToUnit(fontSize);
  ts.position = "absolute";
  po.x = tar.x.baseVal.value;
  po.y = tar.y.baseVal.value;
  po = po.matrixTransform(ctm);
  ts.left = po.x + "px";
  ts.top = po.y + "px";
  ts.width = tar.width.baseVal.value * ctm.a + "px";
  ts.height = tar.height.baseVal.value * ctm.d + "px";
  if (fillOpacity !== 1) {
    ts.filter = "progid:DXImageTransform.Microsoft.Alpha";
    ttfia = tar._tar.filters.item('DXImageTransform.Microsoft.Alpha');
    ttfia.Style = 0;
    ttfia.Opacity = fillOpacity * 100;
    ttfia = void 0;
  }
  evt = tar = style = fontSize = ts = ctm = po = fillOpacity = void 0;
};

base.$1.upsvg("switch")
 .on("initialize",  function (_doc) {
  this._tar = _doc.createElement("v:group");
  _doc = void 0;
  this.addEventListener("DOMNodeInserted", function(evt){
    var tar = evt.target;
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    tar._inserted__(tar);
    evt = tar = void 0;
  }, false);
} );

//bookmarkletから呼び出されたらtrue
var sieb_s;
function GetSVGDocument(ele) {
  this._tar = ele;
  this._next = null;
}
function _ca_() {
  var nt = NAIBU._that;
  if ((nt.xmlhttp.readyState === 4)  &&  (nt.xmlhttp.status === 200)) {
    nt._ca();
  }
  nt = void 0;
};
 GetSVGDocument.prototype = {
  /*_initメソッド
   *object(embed)要素で指定されたSVG文書を読み込んで、SVGを処理して表示させるメソッド
   */
  _init : function() {
    /*objeiはobject要素かembed要素*/
    var xmlhttp = NAIBU.xmlhttp,
        objei = this._tar,
        data= (this._tar.nodeName === "OBJECT") ? "data" : "src";
    objei.style.display = "none";
    /*_baseURLプロパティはXlink言語の相対URIで使う*/
    this._baseURL = objei.getAttribute(data);
    xmlhttp.open("GET", this._baseURL, true);
    xmlhttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    this.xmlhttp = xmlhttp;
    /*クロージャを利用しないことで、軽量化を計る*/
    NAIBU._that = this;
    xmlhttp.onreadystatechange = _ca_;
    xmlhttp.send(null);
    xmlhttp = objei = data = void 0;
  },
  /*コール関数。全処理を担う*/
  _ca : function() {
    /*responseXMLを使うと、時々、空のデータを返すことがあるため（原因はcontent-typeが"text/xml"など特定のものでないと受け付けないため）、
     *ここでは、responseTextを用いる
     */
    var ifr = this._tar,
        ifcw = ifr.contentWindow,
        _doc;
    if (ifcw) {
      ifcw.screen.updateInterval = 999;
      _doc = ifcw.document;
      _doc.write("");
      _doc.close(); // これがないと document.body は null になる
    } else {        //インラインSVGの場合
      _doc = document;
    }
    var docn = _doc.namespaces;
    if (docn && !docn["v"]) {
      docn.add("v","urn:schemas-microsoft-com:vml");
      docn.add("o","urn:schemas-microsoft-com:office:office");
      var st = _doc.createStyleSheet(),
          vmlUrl = "behavior: url(#default#VML);display: inline-block;} "; //inline-blockはIEのバグ対策
      st.cssText = "v\\:rect{" +vmlUrl+ "v\\:image{" +vmlUrl+ "v\\:fill{" +vmlUrl+ "v\\:stroke{" +vmlUrl+ "o\\:opacity2{" +vmlUrl
        + "dn\\:defs{display:none}"
        + "v\\:group{text-indent:0px;position:relative;width:100%;height:100%;" +vmlUrl
        + "v\\:shape{width:100%;height:100%;" +vmlUrl;
      docn = st = vmlUrl = void 0;
    }
    base("DOMImplementation")._doc_ = _doc; //_doc_プロパティはcreateDocumentメソッドで使う
    var str = this.xmlhttp.responseText,
        objei = this._tar,
        s = base("DOMImplementation").createDocument("http://www.w3.org/2000/svg", "svg"),
        tar = s.documentElement,
        tview = tar.viewport,
        objw, objh, fi, attr, w, h,
        sdt = tar._tar,
        sp = _doc.createElement("div"),
        dcp = _doc.createElement("v:group"),
        backr = _doc.createElement("v:rect"),
        style, fontSize, sw, sh, trstyle, backrs, viewWidth, viewHeight, backdown, backright,
        bfl, bft, bl, text, svgload,
        _parseFloat = parseFloat,
        ndoc = NAIBU.doc || this.xmlhttp.responseXML,
        oba = _doc.createElement("div"); //obaはradialGradient要素で使う
    if (!ndoc) { //何らかの原因で読み込み失敗した場合、実行させないようにする
      this.xmlhttp.onreadystatechange = NAIBU.emptyFunction;
      return;
    }
    s.URL = this._baseURL;
    /*openPathプロパティは、tool/funcproto/openfile.jsで使う*/
    this._baseURL && (Function.SIE = {
        openPath: (this._baseURL.replace(/\?.+/, "")
                                .replace(/\/[^\/]+$/, "/"))
    });
    s._iframe = ifr;                     //_iframeプロパティはa要素オブジェクトでリンク置換のときに扱う
    oba.setAttribute("id","_NAIBU_outline");
    _doc.body.appendChild(oba);
    sp.style.margin = "-1px,0px,0px,-1px";
    sp.style.display = "inline-block";
    if (ifcw) {
       _doc.body.style.backgroundColor = objei.parentNode.currentStyle.backgroundColor;
    }
    /*下記のプロパティについては、Microsoftのサイトを参照
     *ResolveExternals Property [Second-level DOM]
     * http://msdn.microsoft.com/en-us/library/ms761375%28VS.85%29.aspx
     *ValidateOnParse Property [Second-level DOM]
     * http://msdn.microsoft.com/en-us/library/ms760286%28VS.85%29.asp
     */
    ndoc.async = ndoc.validateOnParse = ndoc.resolveExternals = false;
    ndoc.preserveWhiteSpace = true;
    ndoc.loadXML(str.replace(/^[\s\S]*?<svg/, "<svg")); //XML宣言のUTF-8は問題が起きるので削除
    /*IE6-8のみで使えるupdateIntervalは、
     *描画間隔の調整が可能。デフォルトは0。
     *スクロール時にバグが起きるので、0に戻してやる必要がある。
     */
    screen.updateInterval = 999;
    if (ndoc.doctype) {
      /*以下の処理は、実体参照を使ったとき
       *代替の処理を用いて、実体参照を処理するもの
       */
      var tmp = str,
          enti = ndoc.doctype.entities,
          map;
      for (var i=0; i<enti.length; ++i) {
        map = enti.item(i);
        tmp = tmp.replace((new RegExp("&"+map.nodeName+";", "g")), map.firstChild.xml);
      }
      ndoc.loadXML(tmp);
      tmp = enti = map = void 0;
    }
    tview.top = tview.left = 0;
    tview.width = objei.clientWidth;
    tview.height = objei.clientHeight;
    if (tview.height < 24) { //IEの標準モードではclientHeightプロパティの値が小さくなることがある
      tview.height = screen.availHeight;
    }
    if (tar.viewport.height < 24) { //IEの標準モードではclientHeightプロパティの値が小さくなることがある
      tar.viewport.height = screen.width;
    }
    objw = objei.getAttribute("width");
    objh = objei.getAttribute("height");
    objw && tar.setAttributeNS(null, "width", objw);
    objh && tar.setAttributeNS(null, "height", objh);
    fi = ndoc.documentElement.firstChild;
    attr = ndoc.documentElement.attributes;
    /*ルート要素のNamedNodeMapを検索する*/
    for (var i=0,atli=attr.length;i<atli;++i) {
      tar.setAttributeNodeNS(s.importNode(attr[i], false));
    }
    str = attr = void 0;
    dcp.style.width = tview.width+ "px";
    dcp.style.height = tview.height+ "px";
    dcp.coordsize = tview.width+ " " +tview.height;
    sp.appendChild(dcp);
    if (ifcw) {
      _doc.body.appendChild(sp);
    } else {
      this._tar.parentNode.insertBefore(sp, this._tar);
    }
    dcp.appendChild(sdt);
    while (fi) { //子ノードを検索して、子供がいれば、importNodeメソッドを再帰的に実行する
      tar.appendChild(s.importNode(fi, true));
      fi = fi.nextSibling;
    }
    fi = void 0;
    /*dom/event.jsのaddEventListenerメソッドなどで、iframe要素のwindowオブジェクトを利用する必要があるため、
     *ドキュメントにそのオブジェクトを結び付けておく
     */
    s._window = ifcw;
    /*以下では、VMLの要素とHTMLのCSSのプロパティを用いて、背景を
     *作り出す作業を行う。これは必須
     */
    style = tar.ownerDocument.defaultView.getComputedStyle(tar, "");
    fontSize = _parseFloat(style.getPropertyValue("font-size"));
    tar.x.baseVal._emToUnit(fontSize);
    tar.y.baseVal._emToUnit(fontSize);
    tar.width.baseVal._emToUnit(fontSize);
    tar.height.baseVal._emToUnit(fontSize);
    sw = tar.width.baseVal.value;
    sh = tar.height.baseVal.value;
    backrs = backr.style;
    backrs.position = "absolute";
    w = tview.width;
    h = tview.height;
    backrs.width = w+ "px";
    backrs.height = h+ "px";
    backrs.zIndex = -1;
    backr.stroked = backr.filled = "false";
    tar._tar.appendChild(backr);
    trstyle = tar._tar.style;
    trstyle.visibility = "visible";
    trstyle.position = "absolute";
    /*以下、画像を切り取り*/
    trstyle.overflow = "hidden";
    /*ウィンドウ枠の長さを決定する*/
    viewWidth = w > sw ? sw : w;
    viewHeight = h > sh ? sh : h;
    backrs = backr.currentStyle;
    bfl = _parseFloat(backrs.left);
    bft = _parseFloat(backrs.top);
    bl = -tar._tx;                  //blやbtは、ずれを調整するのに使う
    bt = -tar._ty;
	//kares
    //if (bfl !== 0 && !isNaN(bfl)) { //内部の図形にずれが生じたとき(isNaNはIE8でautoがデフォルト値のため）
    //  bl = bfl;
    //  dcp.style.left = -bl+ "px";
    //}
    //if (bft !== 0 && !isNaN(bfl)) {
    //  bt = bft;
    //  dcp.style.top = -bt+ "px";
    //}
    backright = bl + viewWidth + 1;
    backdown = bt + viewHeight + 1;
    trstyle.clip = "rect(" +bt+ "px " +backright+ "px " +backdown+ "px " +bl+ "px)";
    this._document = s;
    svgload = function() {
      if ("_svgload_limited" in s.documentElement) {
        /*_svgload_limitedプロパティはXlink言語が使われていない限り、0である。
         *xlink:href属性が指定されるたびに+1となる。
         *0以外は、SVGLoadイベントが発火されない仕組みとなっている
         *
         *目的:
         * Xlinkのリンク先のソースを読み込むまで、SVGLoadイベントを発火させないため
         */
        s.documentElement._svgload_limited--;
        if (s.documentElement._svgload_limited < 0) {
          var evt = s.createEvent("SVGEvents");
          evt.initEvent("SVGLoad", false, false);
          s.documentElement.dispatchEvent(evt);
          evt = void 0;
        }
      }
    };
    //以下、テキストの位置を修正
    text = s.documentElement._tar.getElementsByTagName("div");
    for (var i=0, texti;text[i];++i) {
      texti = text[i];
      if (texti.firstChild.nodeName !== "shape") { //radialGradient用のdiv要素でないならば
        var tis = texti.style;
        tis.left = _parseFloat(tis.left) - bl + "px";
        tis.top = _parseFloat(tis.top) - bt + "px";
      }
    }
    //ビューポートの位置をスクロールで調整　（なお、_txプロパティはhttp://www.w3.org/2000/svgsvgオブジェクトのSIEコードを参照)
    ifcw && ifcw.scroll(-s.documentElement._tx, -s.documentElement._ty);
    s._isLoaded = 1;  //_isLoadedプロパティはevents::dispatchEventメソッドで使う
    s.defaultView._cache = s.defaultView._cache_ele = null;
    oba = _doc = evt = ndoc = objei = tar = tview = objw = objh = sdt = sp = dcp = backr = sw = sh = style = fontSize = void 0;
    trstyle = backrs = text = texti = i = tis = bfl = bft = bl = bt = text = _parseFloat = w = h = viewWidth = viewHeight = backdown = backright = void 0;
    /*IEのメモリリーク対策として、空関数を入力*/
    this.xmlhttp.onreadystatechange = NAIBU.emptyFunction;
    if (this._next) {
      svgload();
      ifcw && (ifr.contentWindow.screen.updateInterval = 0);
      svgload = ifr = ifcw = s = void 0;
      this._next._init();
    } else {
      /*全要素の読み込みが終了した場合*/
      if (s.implementation._buffer_) {
        screen.updateInterval = 0;
        /*以下はバッファリングにためておいた要素とイベントを、後から実行する*/
        NAIBU._buff_num = 0;
        NAIBU._buff = setInterval(function(){
          var n = NAIBU._buff_num,
              dbuf = base("DOMImplementation")._buffer_,
              dbufli = dbuf ? dbuf.length : 0, //極端な負荷がかかると、dbufはnullになる可能性あり
              ts, evt;
          if (dbufli === 0) {
            clearInterval(NAIBU._buff);
            svgload();
            svgload = s = dbuf = n = void 0;
          } else {
            for (var i=0;i<50;++i) {
              ts = dbuf[n];
              evt = dbuf[n+1];
              ts.dispatchEvent(evt);
              n += 2;
              ts = evt = void 0;
              if (n >= dbufli) {
                clearInterval(NAIBU._buff);
                svgload();
                base("DOMImplementation")._buffer_ = null;
                NAIBU.Time.start();
                svgload = s = dbuf = n = dbufli = void 0;
                return;
              }
            }
            NAIBU._buff_num = n;
          }
          dbuf = n = dbufli = void 0;
        }, 1);
        ifr = ifcw = void 0;
      } else {
        svgload();
        svgload = ifr = ifcw = s = void 0;
        NAIBU.Time.start();
      }
      //kares
      //NAIBU.doc = void 0;
    }
  },
  /*SVGDocument*/  getSVGDocument : function() {
    return (this._document);
  }
};
/*空関数（IEのメモリリーク対策)*/
NAIBU.emptyFunction = function() {};

/*style要素をあらわすオブジェクト*/
base.$1.upsvg("style")
 .on("initialize",  function (_doc) {
  base("$StyleSheet").LinkStyle.apply(this);
  /*LinkStyleに関しては、以下の仕様を参照のこと。なお、これはSVG DOMでは継承されていないので要注意。
   *CSS2 1. Document Object Model Style Sheets
   * 1.3. Document Extensions
   *   Interface LinkStyle (introduced in DOM Level 2)
   * http://www.w3.org/TR/DOM-Level-2-Style/stylesheets.html#StyleSheets-LinkStyle
   */
  /*以下はそれぞれ、属性の値に対応している*/
  /*DOMString*/ this.xmlspace;
  /*DOMString*/ this.type = "text/css";
  /*DOMString*/ this.media;
  /*DOMString*/ this.title;
  SVGURIReference.apply(this);
  this.addEventListener("DOMAttrModified", function(evt){
    if (evt.attrName === "type") {
      evt.target.type = evt.newValue;
    } else if (evt.attrName === "title") {
      evt.target.title = evt.newValue;
    }
    evt = void 0;
  }, false);
  this.addEventListener("S_Load", function(evt){
    var tar = evt.target,
        sheet = tar.sheet,
        styleText = tar._text,
        tod = tar.ownerDocument,
        style = _doc.createElement("style"),
        ri, rsc, scri, rsi;
    NAIBU._temp_doc = tod;
    sheet = tod.styleSheets[tod.styleSheets.length] = base("DOMImplementation").createCSSStyleSheet(tar.title, tar.media);
    sheet.ownerNode = tar;
    /*以下は、IEのCSSパーサを使って、スタイルシートのルールを実装していく*/
    _doc.documentElement.firstChild.appendChild(style);
    style.styleSheet.cssText = styleText;
    for (var i=0, rules=style.styleSheet.rules, rli=rules.length;i<rli;++i) {
      ri = rules[i];
      scri = new CSSStyleRule();
      scri.selectorText = ri.selectorText;
      scri.style.cssText = ri.style.cssText;
      rsc = scri.style.cssText.split(";");
      for (var j=0, rsli=rsc.length;j<rsli;++j) {
        rsi = rsc[j].split(": ");
        scri.style.setProperty(rsi[0], rsi[1]);
      }
      sheet.cssRules[sheet.cssRules.length] = scri;
    }
    tod.documentElement.addEventListener("DOMNodeInsertedIntoDocument", function(evt) {
      var tar = evt.target,
          doc = tar.ownerDocument,
          rules = doc.styleSheets[0] ? doc.styleSheets[0].cssRules : [],
          selector, ru,
          tcb = ".,.";
      if (tar.className) { //文字列ノードでなければ
        tcb =  tar.className.baseVal || tcb;
      }
      for (var i=0, rli=rules.length;i<rli;++i) {
        selector = rules[i].selectorText;
        /*_rulesプロパティはCSSモジュールのgetCoumputedStyleメソッドで使う*/
        ru = tar._rules || [];
        if ((selector.indexOf("." +tcb) > -1) || (selector.indexOf("#" +tar.id) > -1)
            || (tar.nodeName === selector)) {
          ru[ru.length] = rules[i];
        }
        tar._rules = ru;
      }
      tar = doc = rules = void 0;
    }, true);
    tar = evt = style = sheet = styleText = tod = i = rules = rli = void 0;
  }, false);
  this.addEventListener("DOMNodeInserted", function(evt){
    var tar = evt.target;
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      if (tar.nodeName === "#cdata-section") {
        evt.currentTarget._text = tar.data;
      }
      return;
    }
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
      var tar = evt.target;
      if ((evt.eventPhase === /*Event.AT_TARGET*/ 2) && !tar.getAttributeNodeNS("http://www.w3.org/1999/xlink", "xlink:href")) {
        var evtt = tar.ownerDocument.createEvent("SVGEvents");
        evtt.initEvent("S_Load", false, false);
        evt.currentTarget.dispatchEvent(evtt);
      }
      tar = evt = void 0;
    }, false);
  }, false);
} );

/*SVGPoint
 *2次元座標の点（x,y)を表すオブジェクト
 */
base("$SVGPoint").mix( {
  /*float*/ x: 0,
  /*float*/ y: 0,
  matrixTransform: function(/*SVGMatrix*/ matrix ) {
    if (!isFinite(matrix.a) || !isFinite(matrix.b) || !isFinite(matrix.c) || !isFinite(matrix.d) || !isFinite(matrix.e) || !isFinite(matrix.f)) {
      throw (new Error("Type Error: 引数の値がNumber型ではありません"));
    }
    var s = base("$SVGPoint").up();
    s.x = matrix.a * this.x + matrix.c * this.y + matrix.e;
    s.y = matrix.b * this.x + matrix.d * this.y + matrix.f;
    return s;
  }
} );


/*SVGPointListのメソッドはSVGStringListを参照*/

/*SVGMatrix
 *行列をあらわすオブジェクト。写像に用いる。以下のように表現できる
 *[a c e]
 *[b d f]
 *[0 0 1]
 */
base("$SVGMatrix").mix( {
  /*float*/ a : 1,
  /*float*/ b : 0,
  /*float*/ c : 0,
  /*float*/ d : 1,
  /*float*/ e : 0,
  /*float*/ f : 0,
  /*multiplyメソッド
   *行列の積を求めて返す
   */
  /*SVGMatrix*/ multiply : function(/*SVGMatrix*/ secondMatrix ) {
    var s = this.$SVGMatrix.up(),
        m = secondMatrix,
        isf = isFinite,
        t = this;
    if (!isf(m.a) || !isf(m.b) || !isf(m.c) || !isf(m.d) || !isf(m.e) || !isf(m.f)) {
      throw (new Error("Type Error: 引数の値がNumber型ではありません"));
    }
    s.a = t.a * m.a + t.c * m.b;
    s.b = t.b * m.a + t.d * m.b;
    s.c = t.a * m.c + t.c * m.d;
    s.d = t.b * m.c + t.d * m.d;
    s.e = t.a * m.e + t.c * m.f + t.e;
    s.f = t.b * m.e + t.d * m.f + t.f;
    m = t = secondMatrix = isf = void 0;
    return s;
  },
  /*inverseメソッド
   *逆行列を返す
   */
  /*SVGMatrix*/ inverse : function() {
    var s = this.$SVGMatrix.up(), 
        n = this._determinant();
    if (n !== 0) {
      s.a = this.d / n;
      s.b = -this.b / n;
      s.c = -this.c / n;
      s.d = this.a / n;
      s.e = (this.c * this.f - this.d * this.e) / n;
      s.f = (this.b * this.e - this.a * this.f) / n;
      return s;
    } else {
      throw (new SVGException(/*SVGException.SVG_MATRIX_NOT_INVERTABLE*/ 2));
    }
  },
  /*SVGMatrix*/ translate : function(/*float*/ x, /*float*/ y ) {
    var m = this.$SVGMatrix.up();
    m.e = x;
    m.f = y;
    var s =  this.multiply(m);
    m = void 0;
    return s;
  },
  /*SVGMatrix*/ scale : function(/*float*/ scaleFactor ) {
    var m = this.$SVGMatrix.up();
    m.a = scaleFactor;
    m.d = scaleFactor;
    var s =  this.multiply(m);
    m = void 0;
    return s;
  },
  /*SVGMatrix*/ scaleNonUniform : function(/*float*/ scaleFactorX, /*float*/ scaleFactorY ) {
    var m = this.$SVGMatrix.up();
    m.a = scaleFactorX;
    m.d = scaleFactorY;
    var s =  this.multiply(m);
    m = void 0;
    return s;
  },
  /*SVGMatrix*/ rotate : function(/*float*/ angle ) {
    var m = this.$SVGMatrix.up(), rad = angle / 180 * Math.PI; //ラジアン変換
    m.a = Math.cos(rad);
    m.b = Math.sin(rad);
    m.c = -m.b;
    m.d = m.a;
    var s =  this.multiply(m);
    m = rad = void 0;
    return s;
  },
  //座標(x, y)と原点の角度の分だけ、回転する
  /*SVGMatrix*/ rotateFromVector : function(/*float*/ x, /*float*/ y ) {
    if ((x === 0) || (y === 0) || !isFinite(x) || !isFinite(y)) {
      throw (new SVGException(/*SVGException.SVG_INVALID_VALUE_ERR*/ 1));
    }
    var m = this.$SVGMatrix.up(), rad = Math.atan2(y, x);
    m.a = Math.cos(rad);
    m.b = Math.sin(rad);
    m.c = -m.b;
    m.d = m.a;
    var s =  this.multiply(m);
    m = rad = void 0;
    return s;
  },
  /*SVGMatrix*/ flipX : function() {
    var m = this.$SVGMatrix.up();
    m.a = -m.a;
    var s =  this.multiply(m);
    m = void 0;
    return s;
  },
  /*SVGMatrix*/ flipY : function() {
    var m = this.$SVGMatrix.up();
    m.d = -m.d;
    var s =  this.multiply(m);
    m = void 0;
    return s;
  },
  /*SVGMatrix*/ skewX : function(/*float*/ angle ){
    var m = this.$SVGMatrix.up(), rad = angle / 180 * Math.PI; //ラジアン変換
    m.c = Math.tan(rad);
    var s =  this.multiply(m);
    m = void 0;
    return s;
  },
  /*SVGMatrix*/ skewY : function(/*float*/ angle ){
    var m = this.$SVGMatrix.up(), rad = angle / 180 * Math.PI;
    m.b = Math.tan(rad);
    var s =  this.multiply(m);
    m = void 0;
    return s;
  },
  //行列式
  /*float*/ _determinant : function() {
    return (this.a * this.d - this.b * this.c);
  }
} );

function SVGTransform() {
  /*readonly SVGMatrix*/ this.matrix = base("$SVGMatrix").up();
};
    // Transform Types
  /*unsigned short*/ SVGTransform.SVG_TRANSFORM_UNKNOWN   = 0;
  /*unsigned short*/ SVGTransform.SVG_TRANSFORM_MATRIX    = 1;
  /*unsigned short*/ SVGTransform.SVG_TRANSFORM_TRANSLATE = 2;
  /*unsigned short*/ SVGTransform.SVG_TRANSFORM_SCALE     = 3;
  /*unsigned short*/ SVGTransform.SVG_TRANSFORM_ROTATE    = 4;
  /*unsigned short*/ SVGTransform.SVG_TRANSFORM_SKEWX     = 5;
  /*unsigned short*/ SVGTransform.SVG_TRANSFORM_SKEWY     = 6;
SVGTransform.prototype = {
  /*ダミーの単位行列。各メソッドで使う*/
  _matrix : base("$SVGMatrix"),
  /*readonly unsigned short*/ type : /*SVGTransform.SVG_TRANSFORM_UNKNOWN*/ 0,
  /*readonly float*/ angle : 0,
  /*void*/ setMatrix : function(/*SVGMatrix*/ matrix ) {
    this.type = /*SVGTransform.SVG_TRANSFORM_MATRIX*/ 1;
    var mat = this._matrix.up();
    mat.a = matrix.a;
    mat.b = matrix.b;
    mat.c = matrix.c;
    mat.d = matrix.d;
    mat.e = matrix.e;
    mat.f = matrix.f;
    this.matrix = mat;
    matrix = mat = void 0;
  },
  /*void*/ setTranslate : function(/*float*/ tx, /*float*/ ty ) {
    this.type = /*SVGTransform.SVG_TRANSFORM_TRANSLATE*/ 2;
    this.matrix = this._matrix.translate(tx, ty);
  },
  /*void*/ setScale : function(/*float*/ sx, /*float*/ sy ) {
    this.type = /*SVGTransform.SVG_TRANSFORM_SCALE*/ 3;
    this.matrix = this._matrix.scaleNonUniform(sx, sy);
  },
  /*void*/ setRotate : function(/*float*/ angle, /*float*/ cx, /*float*/ cy ) {
    this.angle = angle;
    this.type = /*SVGTransform.SVG_TRANSFORM_ROTATE*/ 4;
    this.matrix = this._matrix.rotate(angle);
    this.matrix.e = (1-this.matrix.a)*cx - this.matrix.c*cy;
    this.matrix.f = -this.matrix.b*cx + (1-this.matrix.d)*cy;
  },
  /*void*/ setSkewX : function(/*float*/ angle ) {
    this.angle = angle;
    this.type = /*SVGTransform.SVG_TRANSFORM_SKEWX*/ 5;
    this.matrix = this._matrix.skewX(angle);
  },
  /*void*/ setSkewY : function(/*float*/ angle ) {
    this.angle = angle;
    this.type = /*SVGTransform.SVG_TRANSFORM_SKEWY*/ 6;
    this.matrix = this._matrix.skewY(angle);
  }
};


/*SVGTransformListのメソッドはSVGStringListを参照*/
base("$SVGStringList").$SVGTransformList.mix( {
/*SVGTransform*/ createSVGTransformFromMatrix: function(/*SVGMatrix*/ matrix ) {
  var t = new SVGTransform();
  t.setMatrix(matrix);
  return t;
},
/*SVGTransform*/ consolidate: function() {
  if(this.numberOfItems === 0) {
    return null;
  } else {
    var s = new SVGTransform(),
        m = s.matrix,
        fm;
    if(this.numberOfItems === 1) {
      /*multiplyメソッドの計算回数を減らすため*/
      fm = this.getItem(0).matrix;
      m.a = fm.a;
      m.b = fm.b;
      m.c = fm.c;
      m.d = fm.d;
      m.e = fm.e;
      m.f = fm.f;
    } else {
      for (var i=0,nli=this.numberOfItems;i<nli;++i) {
        m = m.multiply(this.getItem(i).matrix);
      }
      s.matrix = m;
    }
    s.type = 1;
    m = fm = void 0;
    return s;
  }
}
} );

function SVGAnimatedTransformList() {
  /*readonly SVGTransformList*/ this.animVal = this.baseVal = base("$SVGStringList").$SVGTransformList.up();
};

base("SVGPreserveAspectRatio").mix( {
  /*unsigned short*/ align: /*SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_XMIDYMID*/ 6,
  /*unsigned short*/ meetOrSlice: /*SVGPreserveAspectRatio.SVG_MEETORSLICE_MEET*/ 1
} );
/*(function(t) {
    // Alignment Types
  /*unsigned short t.SVG_PRESERVEASPECTRATIO_UNKNOWN  = 0;
  /*unsigned short t.SVG_PRESERVEASPECTRATIO_NONE     = 1;
  /*unsigned short t.SVG_PRESERVEASPECTRATIO_XMINYMIN = 2;
  /*unsigned short t.SVG_PRESERVEASPECTRATIO_XMIDYMIN = 3;
  /*unsigned short t.SVG_PRESERVEASPECTRATIO_XMAXYMIN = 4;
  /*unsigned short t.SVG_PRESERVEASPECTRATIO_XMINYMID = 5;
  /*unsigned short t.SVG_PRESERVEASPECTRATIO_XMIDYMID = 6;
  /*unsigned short t.SVG_PRESERVEASPECTRATIO_XMAXYMID = 7;
  /*unsigned short t.SVG_PRESERVEASPECTRATIO_XMINYMAX = 8;
  /*unsigned short t.SVG_PRESERVEASPECTRATIO_XMIDYMAX = 9;
  /*unsigned short t.SVG_PRESERVEASPECTRATIO_XMAXYMAX = 10;
    // Meet-or-slice Types
  /*unsigned short t.SVG_MEETORSLICE_UNKNOWN   = 0;
  /*unsigned short t.SVG_MEETORSLICE_MEET  = 1;
  /*unsigned short t.SVG_MEETORSLICE_SLICE = 2;
})(base("SVGPreserveAspectRatio"));*/

function SVGAnimatedPreserveAspectRatio() {
  /*readonly SVGPreserveAspectRatio*/ this.animVal = this.baseVal = base("SVGPreserveAspectRatio").up();
};

function SVGPathSeg() {
  /*readonly unsigned short*/ this.pathSegType = /*SVGPathSeg.PATHSEG_UNKNOWN*/ 0;
  /*readonly DOMString*/      this.pathSegTypeAsLetter = null;
};

/*(function(t) {
    // Path Segment Types
  /*unsigned short t.PATHSEG_UNKNOWN                      = 0;
  /*unsigned short t.PATHSEG_CLOSEPATH                    = 1;
  /*unsigned short t.PATHSEG_MOVETO_ABS                   = 2;
  /*unsigned short t.PATHSEG_MOVETO_REL                   = 3;
  /*unsigned short t.PATHSEG_LINETO_ABS                   = 4;
  /*unsigned short t.PATHSEG_LINETO_REL                   = 5;
  /*unsigned short t.PATHSEG_CURVETO_CUBIC_ABS            = 6;
  /*unsigned short t.PATHSEG_CURVETO_CUBIC_REL            = 7;
  /*unsigned short t.PATHSEG_CURVETO_QUADRATIC_ABS        = 8;
  /*unsigned short t.PATHSEG_CURVETO_QUADRATIC_REL        = 9;
  /*unsigned short t.PATHSEG_ARC_ABS                      = 10;
  /*unsigned short t.PATHSEG_ARC_REL                      = 11;
  /*unsigned short t.PATHSEG_LINETO_HORIZONTAL_ABS        = 12;
  /*unsigned short t.PATHSEG_LINETO_HORIZONTAL_REL        = 13;
  /*unsigned short t.PATHSEG_LINETO_VERTICAL_ABS          = 14;
  /*unsigned short t.PATHSEG_LINETO_VERTICAL_REL          = 15;
  /*unsigned short t.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS     = 16;
  /*unsigned short t.PATHSEG_CURVETO_CUBIC_SMOOTH_REL     = 17;
  /*unsigned short t.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS = 18;
  /*unsigned short t.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL = 19;
})(SVGPathSeg);*/
/*SVGPathSegxx
 *軽量化のために、SVGPathSegの実装をしない。
 $SVGPathElementのファクトリーメソッドで実装*/

/*documentは引数の変数として登録しておく*/
(function(_doc, _math) {
//freeArg関数はunloadで使う解放処理
NAIBU.freeArg = function() {
  _doc = _math = void 0;
};
//仮のfill属性とstroke属性の処理
NAIBU._setPaint = function(tar, matrix) {
  /*以下では、スタイルシートを用いて、fill-とstroke-関連の
   *処理を行う。SVGPaintインターフェースをも用いる
   */
  if (!tar._tar) {
    return;
  }
  var tod = tar.ownerDocument,
      _doc = tod._document_,
      el = tar._tar,
      style = tod.defaultView.getComputedStyle(tar, ""),
      fill = style.getPropertyCSSValue("fill"),
      stroke = style.getPropertyCSSValue("stroke"),
      fp = fill.paintType,
      sp = stroke.paintType,
      fillElement, fc,
      num = /*CSSPrimitiveValue.CSS_NUMBER*/ 1,
      color = "color",
      t, evtt, fillOpacity, strs, cursor, vis, disp,
      strokeElement, strokeOpacity, tgebtstroke, sgsw, w, h, swx, tsd, strokedasharray;
  /*あらかじめ、v:fill要素とv:stroke要素は消しておく*/
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
  if ((fp === /*SVGPaint.SVG_PAINTTYPE_RGBCOLOR*/ 1) || (fp === /*SVGPaint.SVG_PAINTTYPE_CURRENTCOLOR*/ 102)) {
    if (fp === /*SVGPaint.SVG_PAINTTYPE_CURRENTCOLOR*/ 102) {
      /*再度、設定。css.jsのsetPropertyを参照*/
      style.setProperty(color, style.getPropertyValue(color));
    }
    fillElement = _doc.createElement("v:fill");
    fc = fill.rgbColor;
    num = /*CSSPrimitiveValue.CSS_NUMBER*/ 1;
    fillElement.setAttribute(color, "rgb(" +fc.red.getFloatValue(num)+ "," +fc.green.getFloatValue(num)+ "," +fc.blue.getFloatValue(num)+ ")");
    fillOpacity = +(style.getPropertyValue("fill-opacity")) * style._list._opacity; //opacityを掛け合わせる
    if (fillOpacity < 1) {
      fillElement.setAttribute("opacity", fillOpacity+"");
    }
    el.appendChild(fillElement);
    fillElement = fc = fillOpacity = void 0;
  } else if (fill.uri) {
    /*以下では、Gradation関連の要素に、イベントを渡すことで、
     *この要素の、グラデーション描画を行う
     */
    t = tod.getElementById(fill.uri);
    if (t) {
      evtt = tod._domnodeEvent();
      evtt._tar = _doc.createElement("v:fill");
      evtt._style = style;
      evtt._ttar = tar;
      t.dispatchEvent(evtt);
      if (t.localName !== "radialGradient") {
        el.appendChild(evtt._tar);
      }
      t = evtt = void 0;
    }
  } else {
    el.filled = "false";
  }
  if ((sp === /*SVGPaint.SVG_PAINTTYPE_RGBCOLOR*/ 1) || (sp === /*SVGPaint.SVG_PAINTTYPE_CURRENTCOLOR*/ 102)) {
    if (sp === /*SVGPaint.SVG_PAINTTYPE_CURRENTCOLOR*/ 102) {
      /*再度、設定。css.jsのsetPropertyを参照*/
      style.setProperty(color, style.getPropertyValue(color));
    }
    strokeElement = _doc.createElement("v:stroke");
    sgsw = style.getPropertyCSSValue("stroke-width");
    w = tod.documentElement.viewport.width;
    h = tod.documentElement.viewport.height;
    sgsw._percent = _math.sqrt((w*w + h*h) / 2);
    swx = sgsw.getFloatValue(/*CSSPrimitiveValue.CSS_NUMBER*/ 1) * _math.sqrt(_math.abs(matrix._determinant()));
    strokeElement.setAttribute("weight", swx + "px");
    sgsw = w = h = void 0;
    if (!stroke.uri) {
      fc = stroke.rgbColor;
      strokeElement.setAttribute(color, "rgb(" +fc.red.getFloatValue(num)+ "," +fc.green.getFloatValue(num)+ "," +fc.blue.getFloatValue(num)+ ")");
      strokeOpacity = +(style.getPropertyValue("stroke-opacity")) * (+(style.getPropertyValue("opacity"))); //opacityを掛け合わせる
      if (swx < 1) {
        strokeOpacity *= swx; //太さが1px未満なら色を薄くする
      }
      if (strokeOpacity < 1) {
        strokeElement.setAttribute("opacity", strokeOpacity+"");
      }
      fc = strokeOpacity = void 0;
    }
    strokeElement.setAttribute("miterlimit", style.getPropertyValue("stroke-miterlimit"));
    strokeElement.setAttribute("joinstyle", style.getPropertyValue("stroke-linejoin"));
    if (style.getPropertyValue("stroke-linecap") === "butt") {
      strokeElement.setAttribute("endcap", "flat");
    } else {
      strokeElement.setAttribute("endcap", style.getPropertyValue("stroke-linecap"));
    }
    tsd = style.getPropertyValue("stroke-dasharray");
    if (tsd !== "none") {
      if (tsd.indexOf(",") > 0) { //コンマ区切りの文字列の場合
        strs = tsd.split(",");
        for (var i = 0, sli = strs.length; i < sli; ++i) {
          strs[i] = _math.ceil(+(strs[i]) / parseFloat(style.getPropertyValue("stroke-width"))); //精密ではないので注意
        }
        strokedasharray = strs.join(" ");
        if (strs.length % 2 === 1) {
          strokedasharray += " " + strokedasharray;
        }
      }
      strokeElement.setAttribute("dashstyle", strokedasharray);
      tsd = strs = void 0;
    }
    el.appendChild(strokeElement);
    strokeElement = tsd = void 0;
  } else {
    el.stroked = "false";
  }
  if (el.style) {
    cursor = style.getPropertyCSSValue("cursor");
    if (cursor && !cursor._isDefault) { //初期値でないならば
      el.style.cursor = cursor.cssText.split(":")[1];
    }
    vis = style.getPropertyCSSValue("visibility");
    if (vis && !vis._isDefault) {
      el.style.visibility = vis.cssText.split(":")[1];
    }
    disp = style.getPropertyCSSValue("display");
    if (disp && !disp._isDefault && (disp.cssText.indexOf("none") > -1)) {
      el.style.display = "none";
    } else if (disp && !disp._isDefault && (disp.cssText.indexOf("inline-block") === -1)) {
      el.style.display = "inline-block";
    }
  }
  tod = _doc = el = fill = stroke = sp = fp = style = cursor = tar = matrix = vis = disp = num = void 0;
};

base.$1.upsvg("path")
  .on("initialize", function (_doc) {
    this._tar = _doc.createElement("v:shape");
    //interface SVGAnimatedPathData
    var sp = base("$SVGStringList").$SVGPathSegList;
    /*readonly SVGPathSegList*/ this.pathSegList = sp.up();
    this.animatedPathSegList = this.pathSegList;
    /*readonly SVGPathSegList*/ this.normalizedPathSegList = sp.up();
    sp = _doc = void 0;
    this.animatedNormalizedPathSegList = this.normalizedPathSegList;
    /*readonly SVGAnimatedNumber*/ this.pathLength = base("$SVGAnimatedNumber").up();
    //以下は、d属性に変更があった場合の処理
    this.addEventListener("DOMAttrModified", this._attrModi, false);
    /*以下の処理は、このpath要素ノードがDOMツリーに追加されて初めて、
     *描画が開始されることを示す。つまり、appendChildで挿入されない限り、描画をしない。
     */
    this.addEventListener("DOMNodeInserted", this._nodeInsert, false);
  } )
  .mix( {
_attrModi: function(evt){
  var tar = evt.target;
  if (evt.attrName === "d" && evt.newValue !== ""){
    /* d属性の値が空の場合は、描画を行わないようにする
     *
     *SVG1.1 「8.3.9 The grammar for path data」の項目にある最後の文章を参照
     */
    var tnl = tar.normalizedPathSegList,
        tlist = tar.pathSegList;
    if (tnl.numberOfItems > 0) {
      tnl.clear();
      tlist.clear();
    }
    /*d属性の値を正規表現を用いて、二次元配列Dに変換している。もし、d属性の値が"M 20 30 L20 40"ならば、
     *JSONにおける表現は以下のとおり
     *D = [["M", 20, 30], ["L", 20 40]]
     */
    var taco = tar._com,
        sgs = taco.isSp,
        dd = evt.newValue
    .replace(taco.isRa, " -")
    .replace(taco.isRb, " ")
    .replace(taco.isRc, ",$1 ")
    .replace(taco.isRd, ",$1 1")
    .replace(taco.isRe, "")
    .replace(/\.(\d+)\./g, ".$1 0.")
    .replace(/[^\w\d\+\-\.\,\n\r\s].*/, "")
    .split(","),
        dli=dd.length,
        isZ = taco._isZ,
        isM = taco._isM,
        isC = taco._isC,
        isL = taco._isL,
        tcc = tar.createSVGPathSegCurvetoCubicAbs,
        tcll = tar.createSVGPathSegLinetoAbs,
        flag, sflag;
    for (var i=0;i<dli;++i) {
      var di = dd[i].match(sgs),
          s;
      for (var j=1, dii=di[0], dili=di.length; j < dili; ++j) {
        if (isC[dii]) {
          s = tcc(+di[j+4], +di[j+5], +di[j], +di[j+1], +di[j+2], +di[j+3]);
          j += 5;
        } else if (isL[dii]) {
          s = tcll(+di[j], +di[j+1]);
          ++j;
        } else if (isM[dii]) {
          s = tar.createSVGPathSegMovetoAbs(+di[j], +di[j+1]);
          ++j;
        } else if (isZ[dii]) {
          s = tar.createSVGPathSegClosePath();
        } else if (dii === "A") {
          flag = di[j+3];
          if (flag.length > 1 && (+flag >= 0)) { /*if no commawsp*/
            di.splice(j+3, 1, flag.charAt(0), flag.slice(1));
            ++dili;
          }
          sflag = di[j+4];
          if (sflag.length > 1 && (+sflag >= 0)) {
            di.splice(j+4, 1, sflag.charAt(0), sflag.slice(1));
            ++dili;
          }
          flag = di[j+3];
          sflag = di[j+4];
          if (((+flag < 0) || (+flag > 1)) || ((+sflag < 0) || (+sflag > 1))) {
            /*仕様では、フラグが0か1しか認められていない*/
            j += 6;
            continue;
          }
          s = tar.createSVGPathSegArcAbs(+di[j+5], +di[j+6], +di[j], +di[j+1], +di[j+2], +flag, +sflag);
          j += 6;
        } else if (dii === "m") {
          s = tar.createSVGPathSegMovetoRel(+di[j], +di[j+1]);
          ++j;
        } else if (dii === "l") {
          s = tar.createSVGPathSegLinetoRel(+di[j], +di[j+1]);
          ++j;
        } else if (dii === "c") {
          s = tar.createSVGPathSegCurvetoCubicRel(+di[j+4], +di[j+5], +di[j], +di[j+1], +di[j+2], +di[j+3]);
          j += 5;
        } else if (dii === "Q") {
          s = tar.createSVGPathSegCurvetoQuadraticAbs(+di[j+2], +di[j+3], +di[j], +di[j+1]);
          j += 3;
        } else if (dii === "q") {
          s = tar.createSVGPathSegCurvetoQuadraticRel(+di[j+2], +di[j+3], +di[j], +di[j+1]);
          j += 3;
        } else if (dii === "a") {
          flag = di[j+3];
          if (flag.length > 1 && (+flag >= 0)) { /*if no commawsp*/
            di.splice(j+3, 1, flag.charAt(0), flag.slice(1));
            ++dili;
          }
          sflag = di[j+4];
          if (sflag.length > 1 && (+sflag >= 0)) {
            di.splice(j+4, 1, sflag.charAt(0), sflag.slice(1));
            ++dili;
          }
          flag = di[j+3];
          sflag = di[j+4];
          if (((+flag < 0) || (+flag > 1)) || ((+sflag < 0) || (+sflag > 1))) {
            /*仕様では、フラグが0か1しか認められていない*/
            j += 6;
            continue;
          }
          s = tar.createSVGPathSegArcRel(+di[j+5], +di[j+6], +di[j], +di[j+1], +di[j+2], +flag, +sflag);
          j += 6;
        } else if (dii === "S") {
          s = tar.createSVGPathSegCurvetoCubicSmoothAbs(+di[j+2], +di[j+3], +di[j], +di[j+1]);
          j += 3;
        } else if (dii === "s") {
          s = tar.createSVGPathSegCurvetoCubicSmoothRel(+di[j+2], +di[j+3], +di[j], +di[j+1]);
          j += 3;
        } else if (dii === "T") {
          s = tar.createSVGPathSegCurvetoQuadraticSmoothAbs(+di[j], +di[j+1]);
          ++j;
        } else if (dii === "t") {
          s = tar.createSVGPathSegCurvetoQuadraticSmoothRel(+di[j], +di[j+1]);
          ++j;
        } else if (dii === "H") {
          s = tar.createSVGPathSegLinetoHorizontalAbs(+di[j]);
        } else if (dii === "h") {
          s = tar.createSVGPathSegLinetoHorizontalRel(+di[j]);
        } else if (dii === "V") {
          s = tar.createSVGPathSegLinetoVerticalAbs(+di[j]);
        } else if (dii === "v") {
          s = tar.createSVGPathSegLinetoVerticalRel(+di[j]);
        } else {
          s = new SVGPathSeg();
        }
        tlist.appendItem(s);
      }
    }
    di = s = sgs = dd = void 0;
    /*以下の処理は、pathSegListからnormalizedPathSegListへの
     *変換をする処理。相対座標を絶対座標に変換して、M、L、Cコマンドに正規化していく
     */
    var cx = 0, cy = 0,         //現在セグメントの終了点の絶対座標を示す　（相対座標を絶対座標に変換するときに使用）
        xn = 0, yn = 0,         //T,tコマンドで仮想的な座標を算出するのに用いる。第一コントロール点
        startx = 0, starty = 0; //M,mコマンドにおける始点座標（Z,zコマンドで用いる）
    for (var j=0, tli=tlist.numberOfItems;j<tli;++j) {
      var ti = tlist.getItem(j),
          ts = ti.pathSegType,
          dii = ti.pathSegTypeAsLetter;
      if (ts === /*SVGPathSeg.PATHSEG_UNKNOWN*/ 0) {
      } else {
        var rx = cx, ry = cy;   //rx, ryは前のセグメントの終了点
        if (ts % 2 === 1) {     //相対座標ならば
          cx += ti.x;
          cy += ti.y;
        } else {
          cx = ti.x;
          cy = ti.y;
        }
        if (isC[dii]) {
          tnl.appendItem(ti);
        } else if (isL[dii]) {
          tnl.appendItem(ti);
        } else if (isM[dii]) {
          if (j !== 0) {
            /*Mコマンドが続いた場合は、2番目以降はLコマンドと解釈する
             *W3C SVG1.1の「8.3.2 The "moveto" commands」を参照
             *http://www.w3.org/TR/SVG11/paths.html#PathDataMovetoCommands
             */
            var tg = tlist.getItem(j-1);
            if (tg.pathSegTypeAsLetter === "M") {
              tnl.appendItem(tcll(cx, cy));
              continue;
            }
          }
          startx = cx;
          starty = cy;
          tnl.appendItem(ti);
        } else if (dii === "m") {
          if (j !== 0) {
            var tg = tlist.getItem(j-1);
            if (tg.pathSegTypeAsLetter === "m") {
              tnl.appendItem(tcll(cx, cy));
              continue;
            }
          }
          startx = cx;
          starty = cy;
          tnl.appendItem(tar.createSVGPathSegMovetoAbs(cx, cy));
        } else if (dii === "l") {
          tnl.appendItem(tcll(cx, cy));
        } else if (dii === "c") {
          tnl.appendItem(tcc(cx, cy, ti.x1+rx, ti.y1+ry, ti.x2+rx, ti.y2+ry));
        } else if (isZ[dii]) {
          cx = startx;
          cy = starty;
          tnl.appendItem(ti);
        } else if (dii === "Q") {
          xn = 2*cx - ti.x1;
          yn = 2*cy - ti.y1;
          //2次スプライン曲線は近似的な3次ベジェ曲線に変換している
          tnl.appendItem(tcc(cx, cy, (rx + 2*ti.x1) / 3, (ry + 2*ti.y1) / 3, (2*ti.x1 + cx) / 3, (2*ti.y1 + cy) / 3));
        } else if (dii === "q") {
          var x1 = ti.x1 + rx, y1 = ti.y1 + ry;
          xn = 2*cx - x1;
          yn = 2*cy - y1;
          tnl.appendItem(tcc(cx, cy, (rx + 2*x1) / 3, (ry + 2*y1) / 3, (2*x1 + cx) / 3, (2*y1 + cy) / 3));
          x1 = y1 = void 0;
        } else if (dii === "A" || dii === "a") {
          (function(ti, cx, cy, rx, ry, tar, tnl) { //変数を隠蔽するためのfunction
            /*以下は、Arctoを複数のCuvetoに変換する処理
             *SVG 1.1 「F.6 Elliptical arc implementation notes」の章を参照
             *http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
             */
            if (ti.r1 === 0 || ti.r2 === 0) {
              return;
            }
            var fS = ti.sweepFlag,
                psai = ti.angle,
                r1 = _math.abs(ti.r1),
                r2 = _math.abs(ti.r2),
                ctx = (rx - cx) / 2,  cty = (ry - cy) / 2,
                cpsi = _math.cos(psai * _math.PI / 180),
                spsi = _math.sin(psai * _math.PI / 180),
                rxd = cpsi*ctx + spsi*cty,
                ryd = -1*spsi*ctx + cpsi*cty,
                rxdd = rxd * rxd, rydd = ryd * ryd,
                r1x = r1 * r1,
                r2y = r2 * r2,
                lamda = rxdd/r1x + rydd/r2y,
                sds;
            if (lamda > 1) {
              r1 = _math.sqrt(lamda) * r1;
              r2 = _math.sqrt(lamda) * r2;
              sds = 0;
            }  else{
              var seif = 1;
              if (ti.largeArcFlag === fS) {
                seif = -1;
              }
              sds = seif * _math.sqrt((r1x*r2y - r1x*rydd - r2y*rxdd) / (r1x*rydd + r2y*rxdd));
            }
            var txd = sds*r1*ryd / r2,
                tyd = -1 * sds*r2*rxd / r1,
                tx = cpsi*txd - spsi*tyd + (rx+cx)/2,
                ty = spsi*txd + cpsi*tyd + (ry+cy)/2,
                rad = _math.atan2((ryd-tyd)/r2, (rxd-txd)/r1) - _math.atan2(0, 1),
                s1 = (rad >= 0) ? rad : 2 * _math.PI + rad,
                rad = _math.atan2((-ryd-tyd)/r2, (-rxd-txd)/r1) - _math.atan2((ryd-tyd)/r2, (rxd-txd)/r1),
                dr = (rad >= 0) ? rad : 2 * _math.PI + rad;
            if (!fS  &&  dr > 0) {
              dr -=   2*_math.PI;
            } else if (fS  &&  dr < 0) {
              dr += 2*_math.PI;
            }
            var sse = dr * 2 / _math.PI,
                seg = _math.ceil(sse<0 ? -1*sse  :  sse),
                segr = dr / seg,
                t = 8/3 * _math.sin(segr/4) * _math.sin(segr/4) / _math.sin(segr/2),
                cpsir1 = cpsi * r1, cpsir2 = cpsi * r2,
                spsir1 = spsi * r1, spsir2 = spsi * r2,
                mc = _math.cos(s1),
                ms = _math.sin(s1),
                x2 = rx - t * (cpsir1*ms + spsir2*mc),
                y2 = ry - t * (spsir1*ms - cpsir2*mc);
            for (var n = 0; n < seg; ++n) {
              s1 += segr;
              mc = _math.cos(s1);
              ms = _math.sin(s1);
              var x3 = cpsir1*mc - spsir2*ms + tx,
                  y3 = spsir1*mc + cpsir2*ms + ty,
                  dx = -t * (cpsir1*ms + spsir2*mc),
                  dy = -t * (spsir1*ms - cpsir2*mc);
              tnl.appendItem(tcc(x3, y3, x2, y2, x3-dx, y3-dy));
              x2 = x3 + dx;
              y2 = y3 + dy;
            }
            ti= cx= cy= rx= ry= tar= tnl = void 0;
          })(ti, cx, cy, rx, ry, tar, tnl);
        } else if (dii === "S") {
          if (j !== 0) {
            var tg = tnl.getItem(tnl.numberOfItems-1);
            if (tg.pathSegTypeAsLetter === "C") {
              var x1 = 2*tg.x - tg.x2,
                  y1 = 2*tg.y - tg.y2;
            } else { //前のコマンドがCでなければ、現在の座標を第1コントロール点に用いる
              var x1 = rx,
                  y1 = ry;
            }
          } else {
            var x1 = rx,
                y1 = ry;
          }
          tnl.appendItem(tcc(cx, cy, x1, y1, ti.x2, ti.y2));
          x1 = y1 = void 0;
        } else if (dii === "s") {
          if (j !== 0) {
            var tg = tnl.getItem(tnl.numberOfItems-1);
            if (tg.pathSegTypeAsLetter === "C") {
              var x1 = 2*tg.x - tg.x2,
                  y1 = 2*tg.y - tg.y2;
            } else {
              var x1 = rx,
                  y1 = ry;
            }
          } else {
            var x1 = rx,
                y1 = ry;
          }
          tnl.appendItem(tcc(cx, cy, x1, y1, ti.x2+rx, ti.y2+ry));
          x1 = y1 = void 0;
        } else if (dii === "T" || dii === "t") {
          if (j !== 0) {
            var tg = tlist.getItem(j-1);
            if ("QqTt".indexOf(tg.pathSegTypeAsLetter) > -1) {
             } else {
              xn = rx, yn = ry;
            }
          } else {
            xn = rx, yn = ry;
          }
          tnl.appendItem(tcc(cx, cy, (rx + 2*xn) / 3, (ry + 2*yn) / 3, (2*xn + cx) / 3, (2*yn + cy) / 3));
          xn = 2*cx - xn;
          yn = 2*cy - yn;
          xx1 = yy1 = void 0;
        } else if (dii === "H" || dii === "h") {
          tnl.appendItem(tcll(cx, ry));
          cy = ry; //勝手にti.yが0としているため
        } else if (dii === "V" || dii === "v") {
          tnl.appendItem(tcll(rx, cy));
          cx = rx;
        }
      }
    }
  }
  evt = tar = taco = cx = cy = xn = yn = startx = starty = tnl = tlist = ti = dii = ts = isZ = isM = isL = isC = s = tcc = tcll = void 0;
},
_nodeInsert: function(evt){
  var tar = evt.target;
  if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
    return; //強制終了させる
  }
  var tnext = tar.nextSibling,
      sar = tar._tar,
      spar = tar.parentNode._tar,
      snext = null;
  if (sar && spar) {
    if (!tnext) {
      spar.appendChild(sar);
    } else {
      while(tnext) {
        if (tnext._tar && tnext._tar.parentNode) {
          /*use要素や実体参照は_tarプロパティをもっていないので、無視する*/
          snext = tnext._tar;
          break;
        }
        tnext = tnext.nextSibling;
      }
      snext && (spar = snext.parentNode);
      spar.insertBefore(sar, snext);
    }
  }
  tnext = sar = spar = snext = void 0;
  tar.addEventListener("DOMNodeInsertedIntoDocument", tar._nodeInsertInto, false);
  evt = tar = void 0;
},
_nodeInsertInto: function(evt){
  /*以下の処理は、normalizedpathSegListとCTMに基づいて、
   *SVGのd属性をVMLに変換していく処理である。
   */
  var tar = evt.target,
      matrix = tar.getScreenCTM(),
      tlist = tar.normalizedPathSegList,
      dat = [],
      ma = matrix.a, mb = matrix.b, mc = matrix.c, md = matrix.d, me = matrix.e, mf = matrix.f,
      cname = tar._com._nameCom,
      isZ = tar._com._isZ, isC = tar._com._isC,
      t;
  for (var i=0, tli=tlist.numberOfItems;i<tli;++i) {
    var ti = tlist[i],
        tx = ti.x,
        ty = ti.y,
        tps = ti.pathSegTypeAsLetter;
    if (isC[tps]) {
      /*CTM(mx）の行列と座標（x, y)の積を算出する。数学における表現は以下のとおり
       *[ma mc me]   [x]
       *[mb md mf] * [y]
       *[0  0  1 ]   [1]
       */
      dat[i] = ["c",
            (ma*ti.x1 + mc*ti.y1 + me) | 0,
            (mb*ti.x1 + md*ti.y1 + mf) | 0,
            (ma*ti.x2 + mc*ti.y2 + me) | 0,
            (mb*ti.x2 + md*ti.y2 + mf) | 0,
            (ma*tx + mc*ty + me) | 0,
            (mb*tx + md*ty + mf) | 0].join(" ");
    } else if (!isZ[tps]) {
      t = cname[tps];
      t += (ma*tx + mc*ty + me) | 0;
      t += " ";
      t += (mb*tx + md*ty + mf) | 0;
      dat[i] = t;
    } else {
      dat[i] = " x ";
    }
  }
  var vi = tar.ownerDocument.documentElement,
      tt = tar._tar;
  dat.push(" e");
  tt.path = dat.join(" ");
  tt.coordsize = vi.width.baseVal.value + " " + vi.height.baseVal.value;
  NAIBU._setPaint(tar, matrix);
  tar._cacheMatrix = evt = tar = dat = t = tx = ty = matrix = tlist = x = y = mr = ma = mb = mc = md = me = mf = vi = isZ = isC = i = tli = tps = ti = cname = tt = void 0;
},
_com: {
  _nameCom : {
    C : "c",
    L : "l",
    M : "m"
  },
  _isZ : {
    z : 1,
    Z : 1
  },
  _isC : {
    C : 1
  },
  _isL : {
    L : 1
  },
  _isM : {
    M : 1
  },
  isRa : /\-/g,
  isRb : /,/g,
  isRc : /([a-yA-Y])/g,
  isRd : /([zZ])/g,
  isRe : /,/,
  isSp : /\S+/g
},
  /*float*/         getTotalLength: function() {
    var s = 0,
        nl = this.normalizedPathSegList;
    for (var i=1,nln=nl.numberOfItems,ms=null;i<nln;++i) {
      var seg = nl.getItem(i);
      if (seg.pathSegType === /*SVGPathSeg.PATHSEG_LINETO_ABS*/ 4) {
        var ps = nl.getItem(i-1);
        s += _math.sqrt(_math.pow((seg.x-ps.x), 2) + _math.pow((seg.y-ps.y), 2));
      } else if (seg.pathSegType === /*SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS*/ 6) {
      } else if (seg.pathSegType === /*SVGPathSeg.PATHSEG_CLOSEPATH*/ 1) {
        var ps = nl.getItem(i-1), ms = nl.getItem(0);
        s += _math.sqrt(_math.pow((ps.x-ms.x), 2) + _math.pow((ps.y-ms.y), 2));
      }

    }
    this.pathLength.baseVal = s;
    return s;
  },
  /*SVGPoint*/      getPointAtLength: function(/*float*/ distance ) {
    var segn = this.getPathSegAtLength(distance),
        x = 0,
        y = 0,
        nl = this.normalizedPathSegList,
        seg = nl.getItem(segn),
        s = this.ownerDocument.documentElement.createSVGPoint();
    if ((segn-1) <= 0) {
      s.x = seg.x;
      s.y = seg.y;
      return s;
    }
    var ps = nl.getItem(segn-1);
    if (seg.pathSegType === /*SVGPathSeg.PATHSEG_LINETO_ABS*/ 4) {
      var segl = _math.sqrt(_math.pow((seg.x-ps.x), 2) + _math.pow((seg.y-ps.y), 2));
      var t = (segl + this._dis) / segl;
      s.x = ps.x + t * (seg.x-ps.x);
      s.y = ps.y + t * (seg.y-ps.y);
    } else if (seg.pathSegType === /*VGPathSeg.PATHSEG_CURVETO_CUBIC_ABS*/ 6) {
      var dd = 0;
      dd += _math.sqrt(_math.pow((seg.x1-ps.x), 2) + _math.pow((seg.y1-ps.y), 2));
      dd += _math.sqrt(_math.pow((seg.x2-seg.x1), 2) + _math.pow((seg.y2-seg.y1), 2));
      dd += _math.sqrt(_math.pow((seg.x2-seg.x1), 2) + _math.pow((seg.y2-seg.y1), 2));
      dd += _math.sqrt(_math.pow((seg.x-ps.x), 2) + _math.pow((seg.y-ps.y), 2));
      var segl = dd / 2;
      var t = (segl + this._dis) / segl;
      /*以下はベジェ曲線の公式について、パラメータtによってまとめて整理したものを、
       *使って、ポイントの座標を演算する
       */
      s.x = (3*seg.x1 + seg.x - 3*seg.x2 - ps.x) * _math.pow(t, 3)
           +3*(ps.x - 2*seg.x1 + seg.x2) * _math.pow(t, 2)
           +3*(seg.x1 - ps.x) * t
           +ps.x;
      s.y = (3*seg.y1 + seg.y - 3*seg.y2 - ps.y) * _math.pow(t, 3)
           +3*(ps.y - 2*seg.y1 + seg.y2) * _math.pow(t, 2)
           +3*(seg.y1 - ps.y) * t
           +ps.y;
    } else if (seg.pathSegType === /*SVGPathSeg.MOVETO_ABS*/ 2) {
      s.x = seg.x;
      s.y = seg.y;
    } else if (seg.pathSegType === /*SVGPathSeg.PATHSEG_CLOSEPATH*/ 1) {
      var ms = nl.getItem(0), segl = _math.sqrt(_math.pow((seg.x-mx.x), 2) + _math.pow((seg.y-ms.y), 2));
      var t = (segl + this._dis) / segl;
      s.x = ms.x + t * (seg.x-ms.x);
      s.y = ms.y + t * (seg.y-ms.y);
    }
    return s;
  },
  /*unsigned long*/ getPathSegAtLength: function(/*float*/ distance ) {
    var nl = this.normalizedPathSegList; //仕様ではpathSegList
    for (var i=0,nln=nl.numberOfItems,ms=null;i<nln;++i) {
      var seg = nl.getItem(i);
      if (seg.pathSegType === /*SVGPathSeg.PATHSEG_LINETO_ABS*/ 4) {
        var ps = nl.getItem(i-1);
        distance -= _math.sqrt(_math.pow((seg.x-ps.x), 2) + _math.pow((seg.y-ps.y), 2));
      } else if (seg.pathSegType === /*SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS*/ 6) {
      } else if (seg.pathSegType === /*SVGPathSeg.PATHSEG_CLOSEPATH*/ 1) {
        var ps = nl.getItem(i-1), ms = nl.getItem(0);
        distance -= _math.sqrt(_math.pow((ps.x-ms.x), 2) + _math.pow((ps.y-ms.y), 2));
      }
      if (distance <= 0) {
        /*_disプロパティは前述のgetPointAtLengthメソッドで使う*/
        this._dis = distance;
        distance = void 0;
        return i;
      }
    }
    /*もし、distanceがパスの距離よりも長い場合、
     *最後のセグメントの番号を返す
     *なお、これはSVG1.1の仕様の想定外のこと
     */
    return (nl.numberOfItems - 1);
  },
  /*SVGPathSegClosePath*/    createSVGPathSegClosePath: function() {
    return {
      pathSegType : /*SVGPathSeg.PATHSEG_CLOSEPATH*/ 1,
      pathSegTypeAsLetter : "z"
    };
  },
  /*SVGPathSegMovetoAbs*/    createSVGPathSegMovetoAbs: function(/*float*/ x, /*float*/ y ) {
    return {
      x: x,
      y: y,
      pathSegType : /*SVGPathSeg.PATHSEG_MOVETO_ABS*/ 2,
      pathSegTypeAsLetter : "M"
    };
  },
  /*SVGPathSegMovetoRel*/    createSVGPathSegMovetoRel: function(/*float*/ x, /*float*/ y ) {
    return {
      x: x,
      y: y,
      pathSegType : /*SVGPathSeg.PATHSEG_MOVETO_REL*/ 3,
      pathSegTypeAsLetter : "m"
    };
  },
  /*SVGPathSegLinetoAbs*/    createSVGPathSegLinetoAbs: function(/*float*/ x, /*float*/ y ) {
    return {
      x: x,
      y: y,
      pathSegType : /*SVGPathSeg.PATHSEG_LINETO_ABS*/ 4,
      pathSegTypeAsLetter : "L"
    };
  },
  /*SVGPathSegLinetoRel*/    createSVGPathSegLinetoRel: function(/*float*/ x, /*float*/ y ) {
    return {
      x: x,
      y: y,
      pathSegType : /*SVGPathSeg.PATHSEG_LINETO_REL*/ 5,
      pathSegTypeAsLetter : "l"
      };
  },
  /*SVGPathSegCurvetoCubicAbs*/    createSVGPathSegCurvetoCubicAbs: function(/*float*/ x, /*float*/ y, /*float*/ x1, /*float*/ y1, /*float*/ x2, /*float*/ y2 ) {
    return {
      x: x,
      y: y,
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      pathSegType : /*SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS*/ 6,
      pathSegTypeAsLetter : "C"
    };
  },
  /*SVGPathSegCurvetoCubicRel*/    createSVGPathSegCurvetoCubicRel: function(/*float*/ x, /*float*/ y, /*float*/ x1, /*float*/ y1, /*float*/ x2, /*float*/ y2 ) {
    return {
      x: x,
      y: y,
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      pathSegType : /*SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL*/ 7,
      pathSegTypeAsLetter : "c"
    };
  },
  /*SVGPathSegCurvetoQuadraticAbs*/    createSVGPathSegCurvetoQuadraticAbs: function(/*float*/ x, /*float*/ y, /*float*/ x1, /*float*/ y1 ) {
    return {
      x: x,
      y: y,
      x1: x1,
      y1: y1,
      pathSegType: /*SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS*/ 8,
      pathSegTypeAsLetter: "Q"
    };
  },
  /*SVGPathSegCurvetoQuadraticRel*/    createSVGPathSegCurvetoQuadraticRel: function(/*float*/ x, /*float*/ y, /*float*/ x1, /*float*/ y1 ) {
    return {
      x: x,
      y: y,
      x1: x1,
      y1: y1,
      pathSegType: /*SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL*/ 9,
      pathSegTypeAsLetter: "q"
    };
  },
  /*SVGPathSegArcAbs*/    createSVGPathSegArcAbs: function(/*float*/ x, /*float*/ y, /*float*/ r1, /*float*/ r2, /*float*/ angle, /*boolean*/ largeArcFlag, /*boolean*/ sweepFlag ) {
    return {
      x: x,
      y: y,
      r1: r1,
      r2: r2,
      angle: angle,
      largeArcFlag: largeArcFlag,
      sweepFlag: sweepFlag,
      pathSegType : /*SVGPathSeg.PATHSEG_ARC_ABS*/ 10,
      pathSegTypeAsLetter : "A"
    };
  },
  /*SVGPathSegArcRel*/    createSVGPathSegArcRel: function(/*float*/ x, /*float*/ y, /*float*/ r1, /*float*/ r2, /*float*/ angle, /*boolean*/ largeArcFlag, /*boolean*/ sweepFlag ) {
    return {
      x: x,
      y: y,
      r1: r1,
      r2: r2,
      angle: angle,
      largeArcFlag: largeArcFlag,
      sweepFlag: sweepFlag,
      pathSegType : /*SVGPathSeg.PATHSEG_ARC_REL*/ 11,
      pathSegTypeAsLetter : "a"
    };
  },
  /*SVGPathSegLinetoHorizontalAbs*/    createSVGPathSegLinetoHorizontalAbs: function(/*float*/ x ) {
    return {
      x: x,
      y: 0, //DOMでは指定されていないが、変換処理が楽なので用いる
      pathSegType: /*SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS*/ 12,
      pathSegTypeAsLetter: "H"
    };
  },
  /*SVGPathSegLinetoHorizontalRel*/    createSVGPathSegLinetoHorizontalRel: function(/*float*/ x ) {
    return {
      x: x,
      y: 0,
      pathSegType: /*SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL*/ 13,
      pathSegTypeAsLetter: "h"
    };
  },
  /*SVGPathSegLinetoVerticalAbs*/    createSVGPathSegLinetoVerticalAbs: function(/*float*/ y ) {
    return {
      x: 0,
      y: y,
      pathSegType: /*SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS*/ 14,
      pathSegTypeAsLetter: "V"
    };
  },
  /*SVGPathSegLinetoVerticalRel*/    createSVGPathSegLinetoVerticalRel: function(/*float*/ y ) {
    return {
      x: 0,
      y: y,
      pathSegType: /*SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL*/ 15,
      pathSegTypeAsLetter: "v"
    };
  },
  /*SVGPathSegCurvetoCubicSmoothAbs*/    createSVGPathSegCurvetoCubicSmoothAbs: function(/*float*/ x, /*float*/ y, /*float*/ x2, /*float*/ y2 ) {
    return {
      x: x,
      y: y,
      x2: x2,
      y2: y2,
      pathSegType:/*SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS*/ 16,
      pathSegTypeAsLetter: "S"
    };
  },
  /*SVGPathSegCurvetoCubicSmoothRel*/    createSVGPathSegCurvetoCubicSmoothRel: function(/*float*/ x, /*float*/ y, /*float*/ x2, /*float*/ y2 ) {
    return {
      x: x,
      y: y,
      x2: x2,
      y2: y2,
      pathSegType: /*SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL*/ 17,
      pathSegTypeAsLetter: "s"
    };
  },
  /*SVGPathSegCurvetoQuadraticSmoothAbs*/    createSVGPathSegCurvetoQuadraticSmoothAbs: function(/*float*/ x, /*float*/ y ) {
    return {
      x: x,
      y: y,
      pathSegType: /*SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS*/ 18,
      pathSegTypeAsLetter: "T"
    };
  },
  /*SVGPathSegCurvetoQuadraticSmoothRel*/    createSVGPathSegCurvetoQuadraticSmoothRel: function(/*float*/ x, /*float*/ y ) {
    return {
      x: x,
      y: y,
      pathSegType: /*SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL*/ 19,
      pathSegTypeAsLetter: "t"
    };
  }
} );
})(document, Math);

base.$1.upsvg("rect")
 .on("initialize",  function (_doc) {
  this._tar = _doc.createElement("v:shape");
  var slen = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/ this.x = new slen();
  /*readonly SVGAnimatedLength*/ this.y = new slen();
  /*readonly SVGAnimatedLength*/ this.width = new slen();
  /*readonly SVGAnimatedLength*/ this.height = new slen();
  /*readonly SVGAnimatedLength*/ this.rx = new slen();
  /*readonly SVGAnimatedLength*/ this.ry = new slen();
  _doc = slen = void 0;
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target,
        tnext = tar.nextSibling,
        sar = tar._tar,
        spar = tar.parentNode._tar,
        snext = null;
    if (sar && spar) {
      if (!tnext) {
        spar.appendChild(sar);
      } else {
        while(tnext) {
          if (tnext._tar && tnext._tar.parentNode) {
            /*use要素や実体参照は_tarプロパティをもっていないので、無視する*/
            snext = tnext._tar;
            break;
          }
          tnext = tnext.nextSibling;
        }
        snext && (spar = snext.parentNode);
        spar.insertBefore(sar, snext);
      }
    }
    tnext = sar = spar = snext = void 0;
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt) {
      var tar = evt.target,
          style = tar.ownerDocument.defaultView.getComputedStyle(tar, ""),
          fontSize = parseFloat(style.getPropertyValue("font-size"));
      tar.x.baseVal._emToUnit(fontSize);
      tar.y.baseVal._emToUnit(fontSize);
      tar.width.baseVal._emToUnit(fontSize);
      tar.height.baseVal._emToUnit(fontSize);
      var rx = tar.getAttributeNS(null, "rx"),
          ry = tar.getAttributeNS(null, "ry"),
          x = tar.x.baseVal.value,
          y = tar.y.baseVal.value,
          xw = x + tar.width.baseVal.value,
          yh = y + tar.height.baseVal.value,
          list;
      if ((rx || ry) && (rx !== "0") && (ry !== "0")) {
        tar.rx.baseVal._emToUnit(fontSize);
        tar.ry.baseVal._emToUnit(fontSize);
        var thrx = tar.rx.baseVal,
            thry = tar.ry.baseVal,
            twidth = tar.width.baseVal.value,
            theight = tar.height.baseVal.value;
        thrx.value = rx ? thrx.value : thry.value;
        thry.value = ry ? thry.value : thrx.value;
        //rx属性が幅より大きければ、幅の半分を属性に設定(ry属性は高さと比較する）
        if (thrx.value > twidth / 2) {
          thrx.value = twidth / 2;
        }
        if (thry.value > theight / 2) {
          thry.value = theight / 2;
        }
        var rxv = thrx.value,
            ryv = thry.value,
            rrx = rxv * 0.55228,
            rry = ryv * 0.55228,
            a = xw - rxv,
            b = x + rxv,
            c = y + ryv,
            d = yh - ryv;
        list = ["m",b,y, "l",a,y, "c",a+rrx,y,xw,c-rry,xw,c, "l",xw,d, "c",xw,d+rry,a+rrx,yh,a,yh, "l",b,yh, "c",b-rrx,yh,x,d+rry,x,d, "l",x,c, "c",x,c-rry,b-rrx,y,b,y];
      } else {
        list = ["m",x,y, "l",x,yh, xw,yh, xw,y, "x e"];
      }
      //以下は、配列listそのものをCTMで座標変換していく処理
      var par = tar.ownerDocument.documentElement,
          ctm = tar.getScreenCTM(),
          dat, p, pmt,
          ele = tar._tar,
          vi = tar.ownerDocument.documentElement,
          w = vi.width.baseVal.value,
          h = vi.height.baseVal.value,
          mr = Math.round;
      for (var i=0, lili=list.length;i<lili;) {
        if (isNaN(list[i])) { //コマンド文字は読み飛ばす
          ++i;
          continue;
        }
        p = par.createSVGPoint();
        p.x = list[i];
        p.y = list[i+1];
        pmt = p.matrixTransform(ctm);
        list[i] = mr(pmt.x);
        ++i;
        list[i] = mr(pmt.y);
        ++i;
        p = pmt = void 0;
      }
      dat = list.join(" ");
      //VMLに結び付けていく
      ele.path = dat;
      ele.coordsize = w + " " + h;
      NAIBU._setPaint(tar, ctm);
      tar._cacheMatrix = evt = tar = style = list = mr = dat = ele = vi = fontSize = void 0;
    }, false);
    evt = tar = void 0;
  }, false);
} );

base.$1.upsvg("circle")
 .on("initialize",  function (_doc) {
  this._tar = _doc.createElement("v:shape");
  var sl = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/ this.cx = new sl();
  /*readonly SVGAnimatedLength*/ this.cy = new sl();
  /*readonly SVGAnimatedLength*/ this.r = new sl();
  _doc = sl = void 0;
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target,
        tnext = tar.nextSibling,
        sar = tar._tar,
        spar = tar.parentNode._tar,
        snext = null;
    if (sar && spar) {
      if (!tnext) {
        spar.appendChild(sar);
      } else {
        while(tnext) {
          if (tnext._tar && tnext._tar.parentNode) {
            /*use要素や実体参照は_tarプロパティをもっていないので、無視する*/
            snext = tnext._tar;
            break;
          }
          tnext = tnext.nextSibling;
        }
        snext && (spar = snext.parentNode);
        spar.insertBefore(sar, snext);
      }
    }
    tnext = sar = spar = snext = void 0;
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt) {
      var tar = evt.target,
          style = tar.ownerDocument.defaultView.getComputedStyle(tar, ""),
          fontSize = parseFloat(style.getPropertyValue("font-size"));
      tar.cx.baseVal._emToUnit(fontSize);
      tar.cy.baseVal._emToUnit(fontSize);
      tar.r.baseVal._emToUnit(fontSize);
      var cx = tar.cx.baseVal.value,
          cy = tar.cy.baseVal.value,
          rx = ry = tar.r.baseVal.value,
          top = cy - ry,
          left = cx - rx,
          bottom = cy + ry,
          right = cx + rx,
          rrx = rx * 0.55228,
          rry = ry * 0.55228,
          list = ["m", cx,top, "c", cx-rrx,top, left,cy-rry, left,cy, left,cy+rry, cx-rrx,bottom, cx,bottom, cx+rrx,bottom, right,cy+rry, right,cy, right,cy-rry, cx+rrx,top, cx,top, "x e"];
        //以下は、配列listそのものをCTMで座標変換していく処理
        var par = tar.ownerDocument.documentElement,
            ctm = tar.getScreenCTM(),
            mr = Math.round;
        for (var i=0, lili=list.length;i<lili;) {
          if (isNaN(list[i])) { //コマンド文字は読み飛ばす
            ++i;
            continue;
          }
          var p = par.createSVGPoint();
          p.x = list[i];
          p.y = list[i+1];
          var pmt = p.matrixTransform(ctm);
          list[i] = mr(pmt.x);
          ++i;
          list[i] = mr(pmt.y);
          ++i;
          p = pmt = void 0;
        }
        var dat = list.join(" "),
            ele = tar._tar,
            vi = tar.ownerDocument.documentElement,
            w = vi.width.baseVal.value,
            h = vi.height.baseVal.value;
        //VMLに結び付けていく
        ele.path = dat;
        ele.coordsize = w + " " + h;
        NAIBU._setPaint(tar, ctm);
        tar._cacheMatrix = evt = tar = list = mr = style = fontSize = dat = ele = void 0;
    }, false);
    evt = tar = void 0;
  }, false);
} );

base.$1.upsvg("ellipse")
 .on("initialize",  function (_doc) {
  this._tar = _doc.createElement("v:shape");
  var sl = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/ this.cx = new sl();
  /*readonly SVGAnimatedLength*/ this.cy = new sl();
  /*readonly SVGAnimatedLength*/ this.rx = new sl();
  /*readonly SVGAnimatedLength*/ this.ry = new sl();
  _doc = sl = void 0;
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target,
        tnext = tar.nextSibling,
        sar = tar._tar,
        spar = tar.parentNode._tar,
        snext = null;
    if (sar && spar) {
      if (!tnext) {
        spar.appendChild(sar);
      } else {
        while(tnext) {
          if (tnext._tar && tnext._tar.parentNode) {
            /*use要素や実体参照は_tarプロパティをもっていないので、無視する*/
            snext = tnext._tar;
            break;
          }
          tnext = tnext.nextSibling;
        }
        snext && (spar = snext.parentNode);
        spar.insertBefore(sar, snext);
      }
    }
    tnext = sar = spar = snext = void 0;
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt) {
      var tar = evt.target,
          style = tar.ownerDocument.defaultView.getComputedStyle(tar, ""),
          fontSize = parseFloat(style.getPropertyValue("font-size"));
      tar.cx.baseVal._emToUnit(fontSize);
      tar.cy.baseVal._emToUnit(fontSize);
      tar.rx.baseVal._emToUnit(fontSize);
      tar.ry.baseVal._emToUnit(fontSize);
      var cx = tar.cx.baseVal.value,
          cy = tar.cy.baseVal.value,
          rx = tar.rx.baseVal.value,
          ry = tar.ry.baseVal.value,
          top = cy - ry,
          left = cx - rx,
          bottom = cy + ry,
          right = cx + rx,
          rrx = rx * 0.55228,
          rry = ry * 0.55228,
          list = ["m", cx,top, "c", cx-rrx,top, left,cy-rry, left,cy, left,cy+rry, cx-rrx,bottom, cx,bottom, cx+rrx,bottom, right,cy+rry, right,cy, right,cy-rry, cx+rrx,top, cx,top, "x e"];
      //以下は、配列listそのものをCTMで座標変換していく処理
      var par = tar.ownerDocument.documentElement,
          ctm = tar.getScreenCTM(),
          mr = Math.round;
      for (var i=0, lili=list.length;i<lili;) {
        if (isNaN(list[i])) { //コマンド文字は読み飛ばす
          ++i;
          continue;
        }
        var p = par.createSVGPoint();
        p.x = list[i];
        p.y = list[i+1];
        var pmt = p.matrixTransform(ctm);
        list[i] = mr(pmt.x);
        ++i;
        list[i] = mr(pmt.y);
        ++i;
        p = pmt = void 0;
      }
      var dat = list.join(" "),
          ele = tar._tar,
          vi = tar.ownerDocument.documentElement,
          w = vi.width.baseVal.value,
          h = vi.height.baseVal.value;
      //VMLに結び付けていく
      ele.path = dat;
      ele.coordsize = w + " " + h;
      NAIBU._setPaint(tar, ctm);
      tar._cacheMatrix = evt = ele = tar = style = fontSize = dat = list = mr = ctm = w = h = void 0;
    }, false);
    evt = tar = void 0;
  }, false);
} );

base.$1.upsvg("line")
 .on("initialize", function (_doc) {
  this._tar = _doc.createElement("v:shape");
  var sl = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/ this.x1 = new sl();
  /*readonly SVGAnimatedLength*/ this.y1 = new sl();
  /*readonly SVGAnimatedLength*/ this.x2 = new sl();
  /*readonly SVGAnimatedLength*/ this.y2 = new sl();
  _doc = sl = void 0;
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target,
        tnext = tar.nextSibling,
        sar = tar._tar,
        spar = tar.parentNode._tar,
        snext = null;
    if (sar && spar) {
      if (!tnext) {
        spar.appendChild(sar);
      } else {
        while(tnext) {
          if (tnext._tar && tnext._tar.parentNode) {
            /*use要素や実体参照は_tarプロパティをもっていないので、無視する*/
            snext = tnext._tar;
            break;
          }
          tnext = tnext.nextSibling;
        }
        snext && (spar = snext.parentNode);
        spar.insertBefore(sar, snext);
      }
    }
    tnext = sar = spar = snext = void 0;
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt) {
      var tar = evt.target,
          style = tar.ownerDocument.defaultView.getComputedStyle(tar, ""),
          fontSize = parseFloat(style.getPropertyValue("font-size"));
      tar.x1.baseVal._emToUnit(fontSize);
      tar.y1.baseVal._emToUnit(fontSize);
      tar.x2.baseVal._emToUnit(fontSize);
      tar.y2.baseVal._emToUnit(fontSize);
      //以下は、配列listそのものをCTMで座標変換していく処理
      var vi = tar.ownerDocument.documentElement,
          ctm = tar.getScreenCTM(),
          dat = "m ",
          mr = Math.round,
          p = vi.createSVGPoint();
      p.x = tar.x1.baseVal.value;
      p.y = tar.y1.baseVal.value;
      var pmt = p.matrixTransform(ctm);
      dat += mr(pmt.x)+ " " +mr(pmt.y)+ " l ";
      p.x = tar.x2.baseVal.value;
      p.y = tar.y2.baseVal.value;
      pmt = p.matrixTransform(ctm);
      dat += mr(pmt.x)+ " " +mr(pmt.y);
      p = pmt = void 0;
      //VMLに結び付けていく
      var ele = tar._tar,
          w = vi.width.baseVal.value,
          h = vi.height.baseVal.value;
      ele.path = dat;
      ele.coordsize = w + " " + h;
      NAIBU._setPaint(tar, ctm);
      tar._cacheMatrix = evt = ele = tar = style = fontSize = dat = list = mr = ctm = vi = w = h = void 0;
    }, false);
    evt = tar = void 0;
  }, false);
} );

/*_GenericSVGPolyElementメソッド
 *　このメソッドはpolygonとpolyline要素共通のインターフェースとして使用。
 * ファイルサイズを軽量にすることができる
 */
base.$1._GenericSVGPolyElement = function (_doc, xclose) {
  this._tar = _doc.createElement("v:shape");
  _doc = void 0;
  //interface SVGAnimatedPoints
  /*readonly SVGPointList*/   this.animatedPoints = this.points = base("$SVGStringList").$SVGPointList.up();;
  this.addEventListener("DOMAttrModified", function(evt){
    var tar = evt.target;
    if (evt.attrName === "points") {
      var tp = tar.points,
          par = tar.ownerDocument.documentElement,
          list = evt.newValue.replace(/^\s+|\s+$/g, "")
                             .replace(/\-/g, " -")
                             .split(/[\s,]+/);
      for (var i=0, p, lili=list.length;i<lili;i+=2) {
        if (isNaN(list[i])) {
          --i;
          continue;
        }
        p = par.createSVGPoint();
        p.x = parseFloat(list[i]);
        p.y = parseFloat(list[i+1]);
        tp.appendItem(p);
      }
    }
    evt = tar = list = tp = par = p = void 0;
  }, false);
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target;
    tar._inserted__(tar);
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt) {
      var tar = evt.target,
          tp = tar.points,
          ctm = tar.getScreenCTM(),
          mr = Math.round;
      //以下は、配列listそのものをCTMで座標変換していく処理
      for (var i=0, list = [], lili=tp.numberOfItems;i<lili;++i) {
        var p = tp.getItem(i),
            pmt = p.matrixTransform(ctm);
        list[2*i] = mr(pmt.x);
        list[2*i + 1] = mr(pmt.y);
        p = pmt = void 0;
      }
      list.splice(2, 0, "l");
      var dat = "m" + list.join(" ") + xclose,
          ele = tar._tar,
          vi = tar.ownerDocument.documentElement,
          w = vi.width.baseVal.value,
          h = vi.height.baseVal.value;
      //VMLに結び付けていく
      ele.path = dat;
      ele.coordsize = w + " " + h;
      NAIBU._setPaint(tar, ctm);
      tar._cacheMatrix = evt = ele = tar = dat = list = mr = ctm = w = h = vi = void 0;
    }, false);
    evt = tar = void 0;
  }, false);
};
base.$1.upsvg("polyline")
 .on("initialize",  function (_doc) {
  this._GenericSVGPolyElement( _doc, "e");
  _doc = void 0;
} );

base.$1.upsvg("polygon")
 .on("initialize",  function (_doc) {
  this._GenericSVGPolyElement(_doc, "x e");
  _doc = void 0;
} );

base.$1.upsvg("text").mix( {
  SVGTextContentElement: function(_doc) {
  /*readonly SVGAnimatedLength*/      this.textLength = new SVGAnimatedLength();
  /*readonly SVGAnimatedEnumeration*/ this.lengthAdjust = base("$SVGAnimatedEnumeration").up();
  this.addEventListener("DOMNodeInserted", function(evt){
    var tar = evt.target,
        cur = evt.currentTarget,
        eph = evt.eventPhase;
    /*Bubblingフェーズの時にはもう、div要素をDOMツリーに挿入しておく必要があるため、
     *あらかじめ、Capturingフェーズで処理しておく
     */
    if ((eph === /*Event.CAPTURING_PHASE*/ 1) && (tar.nodeType === /*Node.TEXT_NODE*/ 3) && !!!tar._tars) {
      /*Textノードにdiv要素を格納したリストをプロパティとして蓄えておく*/
      tar._tars = [];
      /*空白文字を処理して一つのスペースに統一*/
      var data = tar.data.replace(/^[\r\n\s]+|[\r\n\s]+$/g, "").replace(/[\r\n\s]+/g, " ");
      tar.data = data;
      tar.length = data.length;
      data = data.split('');
      for (var i=0, tdli=data.length;i<tdli;++i) {
        var d = _doc.createElement("div"),
            dstyle = d.style;
        dstyle.position = "absolute";
        dstyle.textIndent = dstyle.marginLeft = dstyle.marginRight = dstyle.marginTop = dstyle.paddingTop = dstyle.paddingLeft = "0px";
        dstyle.whiteSpace = "nowrap";
        d.appendChild(_doc.createTextNode(data[i]));
        tar._tars[tar._tars.length] = d;
      }
      data = void 0;
    } else if ((eph === /*Event.CAPTURING_PHASE*/ 1) && (tar.nodeType === /*Node.ELEMENT_NODE*/ 1)
        && (tar.localName !== "tspan") && (tar.localName !== "text")) {
      /*a要素などテキスト関連要素以外の要素が入っている場合を処理*/
      var evtt = tar.ownerDocument.createEvent("MutationEvents");
      evtt.initMutationEvent("DOMNodeInserted", true, false, tar.parentNode, null, null, null, null);
      var f = function(ta) {
        while (ta) {
          if ((ta.nodeType === /*Node.TEXT_NODE*/ 3) && !ta._tars) {
            ta.dispatchEvent(evtt);
          } else if ((ta.nodeType === /*Node.ELEMENT_NODE*/ 1)
        && (ta.localName !== "tspan") && (ta.localName !== "text")) {
            f(ta.firstChild);
          }
          ta = ta.nextSibling;
        }
        ta = void 0;
      };
      f(tar.firstChild);
    }
    evt = tar = cur = eph = evtt = f = void 0;
  }, true);
  this.addEventListener("DOMNodeInserted", function(evt){
    if ((evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3)
         && (evt.target.nodeType === /*Node.TEXT_NODE*/ 3)) {
        evt.currentTarget._length = null; //キャッシュを初期化
      evt = void 0;
    }
  }, false);
  this.addEventListener("DOMNodeRemoved", function(evt){
    var tar = evt.target;
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      evt.currentTarget._length = null;
      tar = evt = void 0;
    }
  }, false);
},
    // lengthAdjust Types
  /*unsigned short SVGTextContentElement.LENGTHADJUST_UNKNOWN           = 0;
  /*unsigned short SVGTextContentElement.LENGTHADJUST_SPACING           = 1;
  /*unsigned short SVGTextContentElement.LENGTHADJUST_SPACINGANDGLYPHS  = 2;*/
  _list: null,         //文字の位置を格納しておくリストのキャッシュ
  _length: null,       //全文字数のキャッシュ
  _stx: 0,
  _sty: 0, //初めの文字の位置
  _chars: 0,           //tspan (tref)要素が全体の何文字目から始まっているか
  _isYokogaki: true,   //横書きかどうか
/*long*/     getNumberOfChars: function() {
  if (this._length) {
    return (this._length);
  } else {
    var s = 0,
        f = function (ts) {
              var ns = s; //nsはsのエイリアス
              while (ts) {
                if (ts.length && (ts.nodeType === /*Node.TEXT_NODE*/ 3)) {
                  ns += ts.length;
                } else if (ts.getNumberOfChars) { //tspan要素などであれば
                  ns += ts.getNumberOfChars();
                } else if (ts.firstChild && (ts.nodeType === /*Node.ELEMENT_NODE*/ 1)) {
                  s = ns;
                  f(ts.firstChild);               //再帰的に呼び出す
                  ns = s;
                }
                ts = ts.nextSibling;
              }
              s = ns;
              ts = ns = void 0;
            };
    f(this.firstChild);
    f= void 0;
    this._length = s;
    return s;
  }
},
/*float*/    getComputedTextLength: function() {
  var l = this.textLength.baseVal;
  if ((l.value === 0) && (this.getNumberOfChars() > 0)) {
    /*何も設定されていない場合のみ、初期化を行う*/
    l.newValueSpecifiedUnits(/*SVGLength.SVG_LENGTHTYPE_NUMBER*/ 1, this.getSubStringLength(0, this.getNumberOfChars()));
  }
  l = void 0;
  return (this.textLength.baseVal.value);
},
/*getSubStringLengthメソッド
 *charnum番目の文字からnchars+charnum-1番目までの文字列の長さを求めて返す
 */
/*float*/    getSubStringLength: function(/*unsigned long*/ charnum, /*unsigned long*/ nchars ) {
  if (nchars === 0) {
    return 0;
  }
  var tg = this.getNumberOfChars();
  if (tg < (nchars+charnum)) {
    /*ncharsが文字列の長さよりも長くなってしまったときには、
     *文字列の末端までの長さを求めるとする（SVG1.1の仕様より）
     */
    nchars = tg - charnum + 1;
  }
  var end = this.getEndPositionOfChar(nchars+charnum-1), st = this.getStartPositionOfChar(charnum);
  if (this._isYokogaki) {
    var s = end.x - st.x;
  } else {
    s = end.y - st.y;
  }
  tg = end = st = void 0;
  return s;
},
/*SVGPoint*/ getStartPositionOfChar: function (/*unsigned long*/ charnum ) {
  if (charnum > this.getNumberOfChars() || charnum < 0) {
    throw (new DOMException(/*DOMException.INDEX_SIZE_ERR*/ 1));
  } else {
    var tar = this,
        tp = tar.parentNode;
    if (!!!tar._list) {
      tar._list = [];
      var chars = tar._chars, //現在、何文字目にあるのか
          x = tar._stx, y = tar._sty, n = 0, //現在のテキスト位置と順番
          style = tar.ownerDocument.defaultView.getComputedStyle(tar, null),
          isYokogaki = ((style.getPropertyValue("writing-mode")) === "lr-tb") ? true : false,
          fontSize = parseFloat(style.getPropertyValue("font-size")),
          tx = tar.x.baseVal, ty = tar.y.baseVal, tdx = tar.dx.baseVal, tdy = tar.dy.baseVal;
      /*親要素の属性も参照しておく*/
      if (tp && ((tp.localName === "text") ||(tp.localName === "tspan"))) {
        var ptx = tp.x.baseVal,
            pty = tp.y.baseVal,
            ptdx = tp.dx.baseVal,
            ptdy = tp.dy.baseVal;
      } else {
        ptx = pty = ptdx = ptdy = {numberOfItems : 0};
      }
      var kern = "f ijltIr.,:;'-\"()",
          akern = "1234567890abcdeghknopquvxyz",
          hfsize = fontSize * 0.5,
          qfsize = fontSize * 0.2,
          isText = (tar.localName === "text");
      if (isYokogaki && isText) {
        y += qfsize;
      } else if (isText){
        x -= hfsize;
      }
      var f = function(ti) {
        var tt, alm, tdc, p, almx, almy, tlist, tg;
        while (ti) {
          if (ti.nodeType === /*Node.TEXT_NODE*/ 3) {
            tt = ti._tars;
            /*tspan(tref)要素のx属性で指定された座標の個数よりも、文字数が多い場合は、祖先（親）のx属性を
             *使う。また、属性が指定されていないときも同様に祖先や親を使う。
             *もし、仮に祖先や親がx属性を指定されていなければ、現在のテキスト位置（変数xに格納している）を使う。
             *この処理はdx属性やdy、y属性でも同様とする
             *参照資料SVG1.1 Text
             *http://www.hcn.zaq.ne.jp/___/REC-SVG11-20030114/text.html
             *
             *注意:ここでは、tspan要素だけではなく、text要素にも適用しているが、本来はtspan要素のみに処理させること
             */
            for (var i=0, tli=tt.length;i<tli;++i) {
              if (n < ptx.numberOfItems - chars) {
                x = ptx.getItem(n).value;
                if (!isYokogaki) {
                  x -= hfsize;
                }
              } else if (n < tx.numberOfItems) {
                x = tx.getItem(n).value;
                if (!isYokogaki) {
                  x -= hfsize;
                }
              }
              if (n < pty.numberOfItems - chars) {
                y = pty.getItem(n).value;
                if (isYokogaki) {
                  y += qfsize;
                }
              } else if (n < ty.numberOfItems) {
                y = ty.getItem(n).value;
                if (isYokogaki) {
                  y += qfsize;
                }
              }
              if (n < ptdx.numberOfItems - chars) {
                x += ptdx.getItem(n).value;
              } else if (n < tdx.numberOfItems) {
                x += tdx.getItem(n).value;
              }
              if (n < ptdy.numberOfItems - chars) {
                y += ptdy.getItem(n).value;
              } else if (n < tdy.numberOfItems) {
                y += tdy.getItem(n).value;
              }
              alm = 0;
              if (isYokogaki) {
                //カーニングを求めて、字の幅を文字ごとに調整する
                tdc = ti.data.charAt(i);
                if (kern.indexOf(tdc) > -1) {
                  alm = fontSize * 0.68;
                } else if (tdc === "s"){
                  alm = fontSize * 0.52;
                } else if ((tdc === "C") || (tdc === "D") || (tdc === "M") || (tdc === "W") || (tdc === "G") || (tdc === "m")){
                  alm = qfsize;
                } else if (akern.indexOf(tdc) > -1){
                  alm = fontSize * 0.45;
                } else {
                  alm = fontSize * 0.3;
                }
              }
              tlist = tar._list;
              tlist[tlist.length] = x;
              tlist[tlist.length] = y;
              tlist[tlist.length] = fontSize - alm;
              if (isYokogaki) {
                x += fontSize;
                x -= alm;
              } else {
                y += fontSize;
              }
              ++n;
            }
            chars += tli;
          } else if (((ti.localName === "tspan") || (ti.localName === "tref"))
              && (ti.namespaceURI === "http://www.w3.org/2000/svg") && ti.firstChild) {
            /*現在のテキスト位置（x,y）の分だけ、tspan (tref)要素をずらしておく。
             *さらに、現在のテキスト位置を更新する
             */
            ti._stx = x;
            ti._sty = y;
            ti._chars = chars;
            p = ti.getStartPositionOfChar(ti.getNumberOfChars());
            almx = almy = 0;
            tlist = ti._list;
            if (isYokogaki) {
              almx = tlist[tlist.length-1];
            } else {
              almy = tlist[tlist.length-1];
            }
            x = tlist[tlist.length-3] + almx;
            y = tlist[tlist.length-2] + almy;
            tar._list = tar._list.concat(tlist);
            tg = ti.getNumberOfChars();
            n += tg;
            chars += tg;
          } else if ((ti.nodeType === /*Node.ELEMENT_NODE*/ 1)
              && ((ti.localName !== "tspan") && (ti.localName !== "tref"))
              && ti.firstChild) {
            /*text関連要素以外の要素の内部にあるテキストノードも処理する*/
            f(ti.firstChild);

          }
          ti = ti.nextSibling;
        }
      };
      f(tar.firstChild);
      tar._isYokogaki = isYokogaki; //getEndPositionOfCharメソッドなどで使う
      f = tt = alm = tdc = p = almx = almy = tlist = tg = void 0;
    }
    tar = isText = hfsize = qfsize = tp = ptx = pty = tx = ty = chars = style = x = y = isYokogaki = kern = akern = void 0;
    var s = this.ownerDocument.documentElement.createSVGPoint();
    s.x = this._list[charnum*3];
    s.y = this._list[charnum*3 + 1];
    s = s.matrixTransform(this.getScreenCTM());
    return s;
  }
},
/*SVGPoint*/ getEndPositionOfChar: function(/*unsigned long*/ charnum ) {
  if (charnum > this.getNumberOfChars() || charnum < 0) {
    throw (new DOMException(/*DOMException.INDEX_SIZE_ERR*/ 1));
  } else {
    var s = this.getStartPositionOfChar(charnum);
    //アドバンス値（すなわちフォントの大きさ）をCTMの行列式を用いて、算出する
    var n = this._list[charnum*3 + 2] * Math.sqrt(Math.abs(this.getScreenCTM()._determinant()));
    if (this._isYokogaki) {
      s.x += n;
    } else {
      s.y += n;
    }
    return s;
  }
},
/*SVGRect*/  getExtentOfChar: function(/*unsigned long*/ charnum ) {

},
/*float*/    getRotationOfChar: function(/*unsigned long*/ charnum ) {

},
/*long*/     getCharNumAtPosition: function(/*SVGPoint*/ point ) {

},
/*void*/     selectSubString: function(/*unsigned long*/ charnum,/*unsigned long*/ nchars ) {

},

SVGTextPositioningElement: function(_doc) {
  this.SVGTextContentElement(_doc);
  var sl = SVGAnimatedLengthList;
  /*readonly SVGAnimatedLengthList*/ this.x = new sl();
  /*readonly SVGAnimatedLengthList*/ this.y = new sl();
  /*readonly SVGAnimatedLengthList*/ this.dx = new sl();
  /*readonly SVGAnimatedLengthList*/ this.dy = new sl();
  sl = void 0;
  /*readonly SVGAnimatedNumberList*/ this.rotate = new SVGAnimatedNumberList();
  this.addEventListener("DOMAttrModified", function(evt){
    var tar = evt.target,
        name = evt.attrName,
        tod = tar.ownerDocument.documentElement,
        _parseFloat = parseFloat;
    if ((name === "x") || (name === "y") || (name === "dx") || (name === "dy")) {
      var enr = evt.newValue.replace(/^\s+|\s+$/g, "").split(/[\s,]+/),
          teas = tar[name].baseVal;
      for (var i=0, tli=enr.length;i<tli;++i) {
        var tea = tod.createSVGLength(),
            n = enr[i].slice(-1),
            type = 0;
        if (n >= "0" && n <= "9") {
          type = /*SVGLength.SVG_LENGTHTYPE_NUMBER*/ 1;
        } else if (n === "%") {
          if ((name === "x") || (name === "dx")) {
            tea._percent *= tod.viewport.width;
          } else if ((name === "y") || (name === "dy")) {
            tea._percent *= tod.viewport.height;
          }
          type = /*SVGLength.SVG_LENGTHTYPE_PERCENTAGE*/ 2;
        } else {
          n = enr[i].slice(-2);
          if (n === "em") {
            var style = tar.ownerDocument.defaultView.getComputedStyle(tar, null);
            tea._percent *= _parseFloat(style.getPropertyValue("font-size"));
            style = void 0;
            type = /*SVGLength.SVG_LENGTHTYPE_EMS*/ 3;
          } else if (n === "ex") {
            type = /*SVGLength.SVG_LENGTHTYPE_EXS*/ 4;
          } else if (n === "px") {
            type = /*SVGLength.SVG_LENGTHTYPE_PX*/ 5;
          } else if (n === "cm") {
            type = /*SVGLength.SVG_LENGTHTYPE_CM*/ 6;
          } else if (n === "mm") {
            type = /*SVGLength.SVG_LENGTHTYPE_MM*/ 7;
          } else if (n === "in") {
            type = /*SVGLength.SVG_LENGTHTYPE_IN*/ 8;
          } else if (n === "pt") {
            type = /*SVGLength.SVG_LENGTHTYPE_PT*/ 9;
          } else if (n === "pc") {
            type = /*SVGLength.SVG_LENGTHTYPE_PC*/ 10;
          }
        }
        var s = _parseFloat(enr[i]);
        s = isNaN(s) ? 0 : s;
        tea.newValueSpecifiedUnits(type, s);
        teas.appendItem(tea);
      }
      tar._list = null;
    }
    evt = tar = void 0;
  }, false);
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      var tar = evt.target;
      if (tar.nodeType !== /*Node.TEXT_NODE*/ 3) {
        tar._list = void 0;
        evt.currentTarget._list = null;
      }
      evt = tar = void 0;
    }
  }, false);
  if (_doc) {
    this._tar = _doc.createElement("v:group");
    this._doc = _doc; //_docプロパティは_texto関数内で使われる
  }
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target,
        tnext = tar.nextSibling,
        sar = tar._tar,
        spar = tar.parentNode._tar,
        snext = null;
    if (sar && spar) {
      if (!tnext) {
        spar.appendChild(sar);
      } else {
        while(tnext) {
          if (tnext._tar && tnext._tar.parentNode) {
            /*use要素や実体参照は_tarプロパティをもっていないので、無視する*/
            snext = tnext._tar;
            break;
          }
          tnext = tnext.nextSibling;
        }
        snext && (spar = snext.parentNode);
        spar.insertBefore(sar, snext);
      }
    }
    tnext = sar = spar = snext = void 0;
    tar.addEventListener("DOMNodeInsertedIntoDocument", tar._texto, false);
    evt = tar = void 0;
  },false);
},
  _texto: function(evt) {
  var tar = evt.target,
      ti = tar.firstChild,
      ttp = tar._tar,
      style = tar.ownerDocument.defaultView.getComputedStyle(tar, null),
      deter = Math.sqrt(Math.abs(tar.getScreenCTM()._determinant())),
      n = parseFloat(style.getPropertyValue("font-size")) * deter,
      mt = -n-5+ "px",
      lh = n+10+ "px",
      tlen = tar.getComputedTextLength(),
      anchor = style.getPropertyValue("text-anchor"),
      isMiddle = (anchor === "middle"),
      isEnd = (anchor === "end"),
      tedeco = style.getPropertyValue("text-decoration"), //text-decorationは継承しないので、個々に設定する
      ttps = ttp.style,
      lts = parseFloat(style.getPropertyValue("letter-spacing")),
      wds = parseFloat(style.getPropertyValue("word-spacing"));
  ttps.fontSize = n + "px"; //nは算出された文字の大きさ (CSSではなく、SVG独自のCTM方式による)
  ttps.fontFamily = style.getPropertyValue("font-family");
  ttps.fontStyle = style.getPropertyValue("font-style");
  ttps.fontWeight = style.getPropertyValue("font-weight");
  if (isFinite(lts)) {
    ttps.letterSpacing = lts * deter + "px";
  }
  if (isFinite(parseFloat(wds))) {
    ttps.wordSpacing = wds * deter + "px";
  }
  var num = 0, //文字数
      searchChild = function(ttp, ti) {
        /*要素の探索関数*/
        while (ti) {
          if (ti.length && (ti.nodeType === /*Node.TEXT_NODE*/ 3)) {
            tstylefunc(ttp, ti, num);
            num += ti.length;
          } else if (ti.getNumberOfChars) { //tspan要素などであれば
            num += ti.getNumberOfChars();
          } else if (ti.firstChild && (ti.nodeType === /*Node.ELEMENT_NODE*/ 1)) {
            if (ti.localName === "a") { //a要素の時だけ
              searchChild(ti._tar, ti.firstChild);
              ttp.appendChild(ti._tar);
            } else {
              searchChild(ttp, ti.firstChild);
            }
          }
          ti = ti.nextSibling;
        }
        ti = tp = void 0;
      },
      isMore = false, //xやy属性の値が複数の数値のときは真
      tstylefunc = function(ttp, textNode, pos) {
        /*div要素を作って、位置を決めていく関数*/
        var divs =textNode._tars,
            isYokogaki = tar._isYokogaki,
            div, sty;
        for (var i=0, dlen=divs.length;i<dlen;++i) {
          var p = tar.getStartPositionOfChar(pos+i);
          if (!isMore && isYokogaki) {
            /*字詰めの処理はブラウザに任せておく*/
            if (textNode._cachedata) { //キャッシュがあれば
              div = textNode._cachedata;
              sty = div.style;
            } else {
              div = tar._doc.createElement("div");
              sty = div.style;
              sty.textIndent = sty.marginLeft = sty.marginRight = sty.marginTop = sty.paddingTop = sty.paddingLeft = "0px";
              sty.whiteSpace = "nowrap";
              div.appendChild(tar._doc.createTextNode(textNode.data));
              textNode._cachedata = div;
            }
          } else {
            div = textNode._tars[i];
          }
          sty = div.style;
          sty.position = "absolute";
          if (isYokogaki) {
            if (isMiddle) {
              p.x -= tlen / 2;
            } else if (isEnd) {
              p.x -= tlen;
            }
          } else {
            if (isMiddle) {
              p.y -= tlen / 2;
            } else if (isEnd) {
              p.y -= tlen;
            }
          }
          sty.left = p.x + "px";
          sty.top = p.y + "px";
          sty.width = sty.height = "0px";
          sty.marginTop = isYokogaki ? mt : "-5px";
          sty.lineHeight = lh;
          sty.textDecoration = tedeco;
          ttp.appendChild(div);
          if (!isMore && isYokogaki) {
            break;
          }
        }
        divs = div = sty = p = isYokogaki = void 0;
  };
  if(tar._isYokogaki) {
    var _t = tar;
    while(tar) {
      /*親要素までさかのぼって調べて、text要素かtspan要素のxとy属性が一つ以上の場合*/
      if (tar.getNumberOfChars && ((tar.x.baseVal.numberOfItems > 1)
          || (tar.y.baseVal.numberOfItems > 1))) {
        isMore = true;
      }
      tar = tar.parentNode;
    }
    tar = _t;
  }
  searchChild(ttp, ti);
  var color = style.getPropertyValue("fill"),
      cursor = style.getPropertyCSSValue("cursor"),
      vis = style.getPropertyCSSValue("visibility"),
      disp = style.getPropertyCSSValue("display"),
      tts = tar._tar.style;
  if (color === "none"){
    tts.color = "transparent";
  } else if (color.indexOf("url") === -1) {
    tts.color = color;
  } else {
    tts.color = "black";
  }
  if (cursor && !cursor._isDefault) { //初期値でないならば
    var tc = cursor.cssText;
    tts.cursor = tc.split(":")[1];
    tc = void 0;
  }
  var isRect = true;
  if (ttp.lastChild) {
    if (ttp.lastChild.nodeName !== "rect") {
      isRect = false;
    }
  } else {
    isRect = false;
  }
  if (!isRect) {
    var backr = tar._doc.createElement("v:rect"),
        backrs = backr.style; //ずれを修正するためのもの
    backrs.width = backrs.height = "1px";
    backrs.left = backrs.top = "0px";
    backr.stroked = backr.filled = "false";
    ttp.appendChild(backr);
  }
  if (vis && !vis._isDefault) {
    tts.visibility = vis.cssText.split(":")[1];
  }
  if (disp && !disp._isDefault && (disp.cssText.indexOf("none") > -1)) {
    tts.display = "none";
  } else if (disp && !disp._isDefault) {
    tts.display = "block";
  }
  tar._cacheMatrix = anchor = isEnd = isMiddle = searchChild = tstylefunc = isMore = mt = lh = isRect = evt = tar = style = tedeco = style = color = cursor = disp = vis = ttps = backr = backrs = jt = lts = deter = void 0;
}
} )
 .on("initialize",  function (_doc) {
  this.SVGTextPositioningElement(_doc);
} );

/*text要素のインターフェースとなるオブジェクトをtspan要素に流用する*/
base.$1["http://www.w3.org/2000/svgtspan"] = base.$1["http://www.w3.org/2000/svgtext"].up();


/*text要素のインターフェースとなるオブジェクトをtref要素に流用する*/
base.$1["http://www.w3.org/2000/svgtref"] = base.$1["http://www.w3.org/2000/svgtext"].up()
 .on("initialize",  function (_doc) {
  this.SVGTextPositioningElement(_doc);
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    evt.target.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:show", "embed");
  }, false);
  this.addEventListener("S_Load", function(evt){
    var tar = evt.target,
        tic = tar._instance.firstChild;
    /*textノードのデータだけを処理*/
    while (tic && (tic.nodeName !== "#text")) {
      tic = tic.nextSibling;
    }
    tic && tar.parentNode.insertBefore(tar.ownerDocument.importNode(tic, false), tar);
    evt.target = tar.parentNode;
    tar.parentNode._texto(evt);
    tar = tic = evtt = void 0;
  }, false);
  SVGURIReference.apply(this);
} );

/*text要素のインターフェースとなるオブジェクトをtextPath要素に流用する*/
base.$1["http://www.w3.org/2000/svgtextPath"] = base.$1["http://www.w3.org/2000/svgtext"].up()
 .on("initialize",  function (_doc) {
  this.SVGTextContentElement(_doc);
  /*readonly SVGAnimatedLength*/      this.startOffset;
  /*readonly SVGAnimatedEnumeration*/ this.method;
  /*readonly SVGAnimatedEnumeration*/ this.spacing;
  SVGURIReference.apply(this);
} );


    // textPath Method Types
  /*t = SVGTextPathElement
   *unsigned short t.TEXTPATH_METHODTYPE_UNKNOWN   = 0;
  /*unsigned short t.TEXTPATH_METHODTYPE_ALIGN     = 1;
  /*unsigned short t.TEXTPATH_METHODTYPE_STRETCH     = 2;
    // textPath Spacing Types
  /*unsigned short t.TEXTPATH_SPACINGTYPE_UNKNOWN   = 0;
  /*unsigned short t.TEXTPATH_SPACINGTYPE_AUTO     = 1;
  /*unsigned short t.TEXTPATH_SPACINGTYPE_EXACT     = 2;*/


base("$CSSValue").$SVGColor.up("$SVGPaint").mix( {
    // Paint Types
  /*unsigned short t.SVG_PAINTTYPE_UNKNOWN               = 0;
  /*unsigned short t.SVG_PAINTTYPE_RGBCOLOR              = 1;
  /*unsigned short t.SVG_PAINTTYPE_RGBCOLOR_ICCCOLOR     = 2;
  /*unsigned short t.SVG_PAINTTYPE_NONE                  = 101;
  /*unsigned short t.SVG_PAINTTYPE_CURRENTCOLOR          = 102;
  /*unsigned short t.SVG_PAINTTYPE_URI_NONE              = 103;
  /*unsigned short t.SVG_PAINTTYPE_URI_CURRENTCOLOR      = 104;
  /*unsigned short t.SVG_PAINTTYPE_URI_RGBCOLOR          = 105;
  /*unsigned short t.SVG_PAINTTYPE_URI_RGBCOLOR_ICCCOLOR = 106;
  /*unsigned short t.SVG_PAINTTYPE_URI                   = 107;*/

  /*readonly unsigned short*/ paintType: /*t.SVG_PAINTTYPE_UNKNOWN*/ 0,
  /*readonly DOMString*/      uri: null,
/*void*/ setUri: function(/*DOMString*/ uri ) {
  this.setPaint(/*SVGPaint.SVG_PAINTTYPE_URI_NONE*/ 103, uri, null, null);
},
/*void*/ setPaint: function(/*unsigned short*/ paintType, /*DOMString*/ uri, /*DOMString*/ rgbColor, /*DOMString*/ iccColor ) {
  if ((paintType < 101 && uri) || (paintType > 102 && !uri)) {
    throw new SVGException(/*SVGException.SVG_INVALID_VALUE_ERR*/ 1);
  }
  this.uri = uri;
  this.paintType = paintType;
  if (paintType === /*SVGPaint.SVG_PAINTTYPE_CURRENTCOLOR*/ 102) {
    paintType = /*SVGColor.SVG_COLORTYPE_CURRENTCOLOR*/ 3;
  }
  this.setColor(paintType, rgbColor, iccColor); //SVGColorのsetColorメソッドを用いる
}
//                    raises( SVGException );
} ) ;

/*makerのインタフェースをsvg要素のオブジェクトで補う場合のみ、getScreenCTMメソッドの扱いに注意すること*/
base.$1.upsvg("marker")
 .on("initialize",  function () {
  var sl = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/      this.refX = new sl();
  /*readonly SVGAnimatedLength*/      this.refY = new sl();
  /*readonly SVGAnimatedEnumeration*/ this.markerUnits = base("$SVGAnimatedEnumeration").up();
  this.markerUnits.baseVal = /*SVGMarkerElement.SVG_MARKERUNITS_STROKEWIDTH*/ 2;
  /*readonly SVGAnimatedLength*/      this.markerWidth = new sl();
  /*readonly SVGAnimatedLength*/      this.markerHeight = new sl();
  this.refX.baseVal.newValueSpecifiedUnits(1, 0);
  this.refY.baseVal.newValueSpecifiedUnits(1, 0);
  this.markerWidth.baseVal.newValueSpecifiedUnits(1, 3);
  this.markerHeight.baseVal.newValueSpecifiedUnits(1, 3);
  sl = void 0;
  /*readonly SVGAnimatedEnumeration*/ this.orientType = base("$SVGAnimatedEnumeration").up();
  this.orientType.baseVal = /*SVGMarkerElement.SVG_MARKER_ORIENT_ANGLE*/ 2;
  /*readonly SVGAnimatedAngle*/       this.orientAngle = new SVGAnimatedAngle();
    //SVGFitToViewBoxのインターフェースはhttp://www.w3.org/2000/svgsvgオブジェクトで代用
  this.addEventListener("DOMAttrModified", function(evt) {
    var tar = evt.target,
        en = evt.newValue,
        angle;
    if (evt.attrName === "orient") {
      if (en === "auto") {
        tar.setOrientToAuto();
      } else {
        angle = tar.ownerDocument.documentElement.createSVGAngle();
        angle.newValueSpecifiedUnits(1, +en);
        tar.setOrientToAngle(angle);
      }
    } else if (evt.attrName === "markerUnits") {
      if (en === "strokeWidth") {
        tar.markerUnits.baseVal = /*SVGMarkerElement.SVG_MARKERUNITS_STROKEWIDTH*/ 2;
      } else {
        tar.markerUnits.baseVal = /*SVGMarkerElement.SVG_MARKERUNITS_USERSPACEONUSE*/ 1;
      }
    }
  }, false);
  this.addEventListener("DOMNodeInsertedIntoDocument", function(evt) {
    /*注意: グローバル関数を書き換えているので注意を要する*/
    var ns = NAIBU._setPaint,
        id = evt.target.getAttributeNS(null, "id");
    NAIBU._setPaint = (function(ns, id) {
      return function(tar, ctm) {
        ns(tar, ctm);
        var td = tar.ownerDocument,
            tde = td.documentElement,
            style = td.defaultView.getComputedStyle(tar, ""),
            ms = style.getPropertyValue("marker-start").slice(5, -1),
            me = style.getPropertyValue("marker-end").slice(5, -1),
            mid = style.getPropertyValue("marker-mid").slice(5, -1),
            marker,
            cmarker,
            gmarker,
            tr,
            tn,
            ttr,
            sth,
            ctm,
            sstyle,
            nstyle,
            plist,
            regAZ,
            regm,
            u, t,
            lf = function (x, y) {
              cmarker = marker.cloneNode(true);
              gmarker = td.createElementNS("http://www.w3.org/2000/svg", "g");
              /*marker要素の子要素はすべて、g要素としてまとめておく*/
              while (cmarker.lastChild) {
                gmarker.appendChild(cmarker.lastChild);
              }
              tr = gmarker.transform.baseVal;
              ttr = tar.transform.baseVal.consolidate() || td.documentElement.createSVGMatrix();
              if (marker.markerUnits.baseVal === /*SVGMarkerElement.SVG_MARKERUNITS_STROKEWIDTH*/ 2) {
                sth = style.getPropertyCSSValue("stroke-width")
                           .getFloatValue( /*CSSPrimitiveValue.CSS_NUMBER*/ 1);
              } else {
                /*参照要素の行列の積を適用*/
                sth = 1;
              }
              if (marker.hasAttributeNS(null, "viewBox")) {
                marker.viewport.width = marker.markerWidth.baseVal.value;
                marker.viewport.height = marker.markerHeight.baseVal.value;
                /*applyを使って、marker要素のCTMを算出*/
                ctm = tde.getScreenCTM.apply(marker);
              } else {
                 ctm = tde.createSVGMatrix();
              }
              if (marker.orientType.baseVal === /*SVGMarkerElement.SVG_MARKER_ORIENT_AUTO*/ 1) {
                angle = Math.atan2(plist[1].y-plist[0].y, plist[1].x-plist[0].x)*180/Math.PI;
              } else {
                angle = marker.orientAngle.baseVal.value;
              }
              tr.appendItem(tr.createSVGTransformFromMatrix(ttr.translate(x, y)
                  .rotate(angle)
                  .scale(sth)
                  .multiply(ctm)
                  .translate(-marker.refX.baseVal.value, -marker.refY.baseVal.value)));
              sstyle = td.defaultView.getComputedStyle(marker, "");
              nstyle = gmarker.style;
              regAZ = /([A-Z])/;
              regm = /\-/;
              for (var i in CSS2Properties) {
                if (CSS2Properties.hasOwnProperty(i) && (i !== "_list")) {
                  i = i.replace(regAZ, "-");
                  if (RegExp.$1) {
                    u = "-" +RegExp.$1.toLowerCase();
                  } else {
                    u = "-";
                  }
                  i = i.replace(regm, u);
                  nstyle.setProperty(i, sstyle.getPropertyValue(i), "");
                }
              }
              tar.parentNode.insertBefore(gmarker, tar.nextSibling);
            };
        /*url(#id)で一致する文字列があるかどうか*/
        if (ms === id) {
          marker = td.getElementById(ms);
          if (tar.normalizedPathSegList || tar.points) {
            tn = tar.normalizedPathSegList || tar.points;
            plist = [tn.getItem(0), tn.getItem(1)];
            if (!plist[1].x) { //Zコマンドならば
              plist[1] = plist[0];
            }
          } else if (tar.x1) {
            plist = [{x:tar.x1.baseVal.value, y:tar.y1.baseVal.value}, {x:tar.x2.baseVal.value, y:tar.y2.baseVal.value}];
          }
          lf(plist[0].x, plist[0].y);
        }
        if (me === id) {
          marker = td.getElementById(me);
          if (tar.normalizedPathSegList || tar.points) {
            tn = tar.normalizedPathSegList || tar.points;
            plist = [tn.getItem(tn.numberOfItems-2), tn.getItem(tn.numberOfItems-1)];
            if (!plist[1].x) { //Zコマンドならば
              plist[1] = tn.getItem(0);
            }
          } else if (tar.x1) {
            plist = [{x:tar.x1.baseVal.value, y:tar.y1.baseVal.value}, {x:tar.x2.baseVal.value, y:tar.y2.baseVal.value}];
          }
          lf(plist[1].x, plist[1].y);
        }
        if (mid === id) {
          marker = td.getElementById(mid);
        }
        td = tde = style = sstyle = nstyle = ms = me = mid = marker = cmarker = gmarker = ctm = sth = tr = tn = ttr = plist = regAZ = regm = u = t = lf = void 0;
     };
    })(ns, id);
  }, false);
} )
 .mix( {
    // Marker Unit Types
  /*unsigned short t.SVG_MARKERUNITS_UNKNOWN        = 0;
  /*unsigned short t.SVG_MARKERUNITS_USERSPACEONUSE = 1;
  /*unsigned short t.SVG_MARKERUNITS_STROKEWIDTH    = 2;
    // Marker Orientation Types
  /*unsigned short t.SVG_MARKER_ORIENT_UNKNOWN      = 0;
  /*unsigned short t.SVG_MARKER_ORIENT_AUTO         = 1;
  /*unsigned short t.SVG_MARKER_ORIENT_ANGLE        = 2;*/
  /*void*/ setOrientToAuto: function() {
    this.orientType.baseVal = /*t.SVG_MARKER_ORIENT_AUTO*/ 1;
  },
/*void*/ setOrientToAngle: function(/*SVGAngle*/ angle ) {
    this.orientType.baseVal = /*t.SVG_MARKER_ORIENT_ANGLE*/ 2;
    this.orientAngle.baseVal = angle;
  }
} );

base.$1.upsvg("colorProfile")
 .on("initialize",  function () {
  /*DOMString*/      this._local;
                         // raises DOMException on setting
                       // (NOTE: is prefixed by "_"
                       // as "local" is an IDL keyword. The
                       // prefix will be removed upon processing)
  /*DOMString*/      this.name;
  /*unsigned short*/ this.renderingIntent;
  SVGURIReference.apply(this);
} );

base("$CSSStyleRule").$SVGCSSRule.up("$SVGColorProfileRule").mix( {
  /*DOMString      this.src;*/
  /*DOMString      this.name;*/
  /*unsigned short this.renderingIntent;*/
} );

/*$LinearGradientElementと$radialGradientElementの初期化として使う*/
base.$1.SVGGradientElement = function () {
  SVGURIReference.apply(this);
  /*readonly SVGAnimatedEnumeration*/   this.gradientUnits = base("$SVGAnimatedEnumeration").up();
  /*readonly SVGAnimatedTransformList*/ this.gradientTransform = new SVGAnimatedTransformList();
  /*readonly SVGAnimatedEnumeration*/   this.spreadMethod = base("$SVGAnimatedEnumeration").up();
  this.addEventListener("DOMNodeInsertedIntoDocument", function(evt) {
    var grad = evt.target,
        ele = evt._tar,
        t = evt._style, //eleはv:fill要素やv:stroke要素のノード、tはラップした要素ノードのスタイルを収納
        grad2 = grad,
        href, stops, length,
        color = [],
        colors = [],
        opacity = [],
        stop, sstyle, ci, o1, o2;
    if (!ele || !grad) { //まだ、path要素などが設定されていない場合
      grad = ele = t = grad2 = href = stops = length = color = colors = opacity = void 0;
      return;
    }
    if (grad._instance) { //xlink言語で呼び出されたノードが_instanceに収納されているならば
      grad2 = grad._instance;
    }
    stops = grad2.getElementsByTagNameNS("http://www.w3.org/2000/svg", "stop");
    if (!stops) {
      ele = t = href = grad = grad2 = stops = color = colors = opacity = void 0;
      return;
    }
    length = stops.length;
    for (var i = 0; i < length; ++i) {
      stop = stops[i];
      sstyle = stop.ownerDocument.defaultView.getComputedStyle(stop, "");
      ci = sstyle.getPropertyCSSValue("stop-color");
      if (ci && (ci.colorType === /*SVGColor.SVG_COLORTYPE_CURRENTCOLOR*/ 3)) {
        /*再度、設定。css.jsのsetPropertyを参照*/
        sstyle.setProperty("color", sstyle.getPropertyValue("color"));
      }
      color[i] =  "rgb(" +ci.rgbColor.red.getFloatValue(1)+ "," +ci.rgbColor.green.getFloatValue(1)+ "," +ci.rgbColor.blue.getFloatValue(1)+ ")";
      colors[i] = stop.offset.baseVal.toPrecision(2) + " " + color[i];
      opacity[i] = (sstyle.getPropertyValue("stop-opacity") || 1) * t.getPropertyValue("fill-opacity") * t.getPropertyValue("opacity");
    }
    ele["method"] = "none";
    ele["color"] = color[0];
    ele["color2"] = color[length-1];
    if (length > 2) {
      ele["colors"] = colors.slice(1, -1).join(","); //配列colorsの先頭と最後の項目は除いておく
      o1 = opacity[length-1]+ "";
      o2 = opacity[0]+ "";
    } else {
      o2 = opacity[length-1]+ "";
      o1 = opacity[0]+ "";
    }
    // When colors attribute is used, the meanings of opacity and o:opacity2 are reversed.
    ele["opacity"] = o1;
    ele["o:opacity2"] = o2;
    /*SVGRadialGradientElementインターフェースで利用する*/
    grad._color = color;
    var gt = grad2.getAttributeNS(null, "gradientTransform");
    if (gt) {
      grad.setAttributeNS(null, "transform", gt);
    }
    grad = grad2 = ele = stops = length = color = colors = opacity = evt = t = href = stop = sstyle = ci = o1 = o2 = void 0;
  }, false);
};
    // Spread Method Types
  /*unsigned short SVGGradientElement.SVG_SPREADMETHOD_UNKNOWN = 0;
  /*unsigned short SVGGradientElement.SVG_SPREADMETHOD_PAD     = 1;
  /*unsigned short SVGGradientElement.SVG_SPREADMETHOD_REFLECT = 2;
  /*unsigned short SVGGradientElement.SVG_SPREADMETHOD_REPEAT  = 3;*/

base.$1.upsvg("linearGradient").on("initialize", function () {
  this.SVGGradientElement();
  var sl = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/ this.x1 = new sl();
  /*readonly SVGAnimatedLength*/ this.y1 = new sl();
  /*readonly SVGAnimatedLength*/ this.x2 = new sl();
  /*readonly SVGAnimatedLength*/ this.y2 = new sl();
  sl = void 0;
  this.addEventListener("DOMNodeInsertedIntoDocument", function(evt) {
    var grad = evt.target, ele = evt._tar, angle = 270;
    if (!!!ele) { //まだ、path要素などが設定されていない場合
      return;
    }
    var style = grad.ownerDocument.defaultView.getComputedStyle(grad, "");
    var fontSize = parseFloat(style.getPropertyValue("font-size"));
    grad.x1.baseVal._emToUnit(fontSize);
    grad.y1.baseVal._emToUnit(fontSize);
    grad.x2.baseVal._emToUnit(fontSize);
    grad.y2.baseVal._emToUnit(fontSize);
    angle = 270 - Math.atan2(grad.y2.baseVal.value-grad.y1.baseVal.value, grad.x2.baseVal.value-grad.x1.baseVal.value) * 180 / Math.PI;
    if (angle >= 360) {
      angle -= 360;
    }
    ele.setAttribute("type", "gradient");
    ele.setAttribute("angle", angle + "");
    evt = ele = grad = angle = style = fontSize = void 0;
  }, false);
} );

base.$1.upsvg("radialGradient").on("initialize", function (_doc) {
  this.SVGGradientElement();
  var sl = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/ this.cx = new sl();
  /*readonly SVGAnimatedLength*/ this.cy = new sl();
  /*readonly SVGAnimatedLength*/ this.r = new sl();
  /*readonly SVGAnimatedLength*/ this.fx = new sl();
  /*readonly SVGAnimatedLength*/ this.fy = new sl();
  sl = void 0;
  this.cx.baseVal.value = this.cy.baseVal.value = this.r.baseVal.value = 0.5;
  this.addEventListener("DOMNodeInsertedIntoDocument", function(evt) {
    var grad = evt.target,
        ele = evt._tar,
        tar = evt._ttar; //eleはv:fill要素。tarはターゲットとになる要素
    if (!!!ele) { //まだ、path要素などが設定されていない場合
      return;
    }
    ele.setAttribute("type", "gradientTitle");
    ele.setAttribute("focus", "100%");
    ele.setAttribute("focusposition", "0.5 0.5");
    if (tar.localName === "rect") {
      /*VMLでは、図の形状に沿って、円状のグラデーションを処理するようになっているため、
       *四角だとおかしな模様が出てしまう。以下はそれを避ける処理
       */
      var style = grad.ownerDocument.defaultView.getComputedStyle(tar, ""),
          fontSize = parseFloat(style.getPropertyValue("font-size"));
      grad.cx.baseVal._emToUnit(fontSize);
      grad.cy.baseVal._emToUnit(fontSize);
      grad.r.baseVal._emToUnit(fontSize);
      grad.fx.baseVal._emToUnit(fontSize);
      grad.fy.baseVal._emToUnit(fontSize);
      var cx = grad.cx.baseVal.value,
          cy = grad.cy.baseVal.value,
          r = grad.r.baseVal.value,
          rx, ry;
      rx = ry = r;
      var tarrect = tar.getBBox(),
          vi = tar.ownerDocument.documentElement.viewport,
          el = vi.width | 0,
          et = vi.height | 0,
          er = 0,
          eb = 0,
          units = grad.getAttributeNS(null, "gradientUnits");
      if (!units || units === "objectBoundingBox") {
        //%の場合は小数点に変換(10% -> 0.1)
        cx = cx > 1 ? cx/100 : cx;
        cy = cy > 1 ? cy/100 : cy;
        r = r > 1 ? r/100 : r;
        //要素の境界領域を求める（四隅の座標を求める）
        var nx = tarrect.x,
            ny = tarrect.y,
            wid = tarrect.width,
            hei = tarrect.height;
        cx = cx*wid + nx;
        cy = cy*hei + ny;
        rx = r*wid;
        ry = r*hei;
        nx = ny = wid = hei = void 0;
      }
      var matrix = tar.getScreenCTM().multiply(grad.getCTM());
      el = cx - rx;
      et = cy - ry;
      er = cx + rx;
      eb = cy + ry;
      var rrx = rx * 0.55228,
          rry = ry * 0.55228,
          list = ["m", cx,et, "c", cx-rrx,et, el,cy-rry, el,cy, el,cy+rry, cx-rrx,eb, cx,eb, cx+rrx,eb, er,cy+rry, er,cy, er,cy-rry, cx+rrx,et, cx,et, "x e"];
      for (var i = 0, lili = list.length; i < lili;) {
        if (isNaN(list[i])) { //コマンド文字は読み飛ばす
          ++i;
          continue;
        }
        var p = grad.ownerDocument.documentElement.createSVGPoint();
        p.x = parseFloat(list[i]);
        p.y = parseFloat(list[i+1]);
        var pmt = p.matrixTransform(matrix);
        list[i] = pmt.x | 0;
        i++;
        list[i] = pmt.y | 0;
        i++;
        p = pmt = void 0;
      }
      var ellipse = list.join(" "),
          outline = _doc.getElementById("_NAIBU_outline"),
          background = _doc.createElement("div"),
          bstyle = background.style;
      bstyle.position = "absolute";
      bstyle.display = "inline-block";
      var w = vi.width,
          h = vi.height;
      bstyle.textAlign = "left";
      bstyle.top = bstyle.left = "0px";
      bstyle.width = w+ "px";
      bstyle.height = h+ "px";
      outline.appendChild(background);
      bstyle.filter = "progid:DXImageTransform.Microsoft.Compositor";
      background.filters.item('DXImageTransform.Microsoft.Compositor').Function = 23;
      var circle = '<v:shape style="display:inline-block; position:relative; antialias:false; top:0px; left:0px;" coordsize="' +w+ ' ' +h+ '" path="' +ellipse+ '" stroked="f">' +ele.outerHTML+ '</v:shape>',
          data = tar._tar.path.value;
      background.innerHTML = '<v:shape style="display:inline-block; position:relative; top:0px; left:0px;" coordsize="' +w+ ' ' +h+ '" path="' +data+ '" stroked="f" fillcolor="' +grad._color[grad._color.length-1]+ '" ></v:shape>';
      background.filters[0].apply();
      background.innerHTML = circle;
      background.filters[0].play();
      tar._tar.parentNode.insertBefore(background, tar._tar);
      tar._tar.filled = "false";
      ellipse = outline = background = style = fontSize = bstyle = circle = data = list = gt = cx = cy = r = w = h = matrix = void 0;
    } else if (!ele.parentNode){
      tar._tar.appendChild(ele);
    }
    evt = tar = ele = gard = void 0;
  }, false);
} );

base.$1.upsvg("stop").on("initialize",  function () {
  /*readonly SVGAnimatedNumber*/ this.offset = base("$SVGAnimatedNumber").up();
  this.addEventListener("DOMAttrModified", function(evt) {
    if (evt.attrName === "offset") {
      var env = evt.newValue;
      if (env.slice(-1) !== "%") {
        evt.target.offset.baseVal = +env;
      } else {
        evt.target.offset.baseVal = parseFloat(env) / 100;
      }
    }
    evt = void 0;
  }, false);
} );

base.$1.upsvg("pattern")
 .on("initialize",  function () {
  var sl = SVGAnimatedLength;
  /*readonly SVGAnimatedEnumeration*/   this.patternUnits = base("$SVGAnimatedEnumeration").up();
  /*readonly SVGAnimatedEnumeration*/   this.patternContentUnits = base("$SVGAnimatedEnumeration").up();
  /*readonly SVGAnimatedTransformList*/ this.patternTransform = new SVGAnimatedTransformList();
  /*readonly SVGAnimatedLength*/        this.x = new sl();
  /*readonly SVGAnimatedLength*/        this.y = new sl();
  /*readonly SVGAnimatedLength*/        this.width = new sl();
  /*readonly SVGAnimatedLength*/        this.height = new sl();
  sl = void 0;
  SVGURIReference.apply(this);
    //SVGFitToViewBoxのインターフェースを用いる
  /*readonly SVGAnimatedRect*/   this.viewBox = new SVGAnimatedRect();
  /*readonly SVGAnimatedPreserveAspectRatio*/ this.preserveAspectRatio = new SVGAnimatedPreserveAspectRatio();
  /*unsigned short*/             this.zoomAndPan = /*SVGZoomAndPan.SVG_ZOOMANDPAN_DISABLE*/ 1;
} );

base.$1.upsvg("clipPath")
 .on("initialize",  function () {
  /*readonly SVGAnimatedEnumeration*/ this.clipPathUnits = base("$SVGAnimatedEnumeration").up();
} );

base.$1.upsvg("mask")
 .on("initialize",  function () {
  var sl = SVGAnimatedLength;
  /*readonly SVGAnimatedEnumeration*/ this.maskUnits = base("$SVGAnimatedEnumeration").up();
  /*readonly SVGAnimatedEnumeration*/ this.maskContentUnits = base("$SVGAnimatedEnumeration").up();
  /*readonly SVGAnimatedLength*/      this.x = new sl();
  /*readonly SVGAnimatedLength*/      this.y = new sl();
  /*readonly SVGAnimatedLength*/      this.width = new sl();
  /*readonly SVGAnimatedLength*/      this.height = new sl();
  sl = void 0;
} );

base.$1.upsvg("filter")
 .on("initialize",  function () {
  var sl = SVGAnimatedLength;
  /*readonly SVGAnimatedEnumeration*/ this.filterUnits = base("$SVGAnimatedEnumeration").up();
  /*readonly SVGAnimatedEnumeration*/ this.primitiveUnits = base("$SVGAnimatedEnumeration").up();
  /*readonly SVGAnimatedLength*/      this.x = new sl();
  /*readonly SVGAnimatedLength*/      this.y = new sl();
  /*readonly SVGAnimatedLength*/      this.width = new sl();
  /*readonly SVGAnimatedLength*/      this.height = new sl();
  sl = void 0;
  /*readonly SVGAnimatedInteger*/     this.filterResX = base("$SVGAnimatedInteger").up();
  /*readonly SVGAnimatedInteger*/     this.filterResY = base("$SVGAnimatedInteger").up();
  SVGURIReference.apply(this);
  //setFilterRes (/*unsigned long*/ filterResX,/*unsigned long*/ filterResY );
} );

function SVGFilterPrimitiveStandardAttributes(ele) {
  SVGStylable.apply(this, arguments);
  this._tar = ele;
  var sl = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/ this.x = new sl();
  /*readonly SVGAnimatedLength*/ this.y = new sl();
  /*readonly SVGAnimatedLength*/ this.width = new sl();
  /*readonly SVGAnimatedLength*/ this.height = new sl();
  /*readonly SVGAnimatedString*/ this.result = base("$SVGAnimatedString").up();
  sl = void 0;
};

base.$1.upsvg("feBlend")
 .on("initialize",  function () {
  /*readonly SVGAnimatedString*/      this.in1 = base("$SVGAnimatedString").up();
  /*readonly SVGAnimatedString*/      this.in2 = base("$SVGAnimatedString").up();
  /*readonly SVGAnimatedEnumeration*/ this.mode = base("$SVGAnimatedEnumeration").up();
  this._fpsa = SVGFilterPrimitiveStandardAttributes(this);
} );
    // Blend Mode Types
  /*unsigned short SVGFEBlendElement.SVG_FEBLEND_MODE_UNKNOWN  = 0;
  /*unsigned short SVGFEBlendElement.SVG_FEBLEND_MODE_NORMAL   = 1;
  /*unsigned short SVGFEBlendElement.SVG_FEBLEND_MODE_MULTIPLY = 2;
  /*unsigned short SVGFEBlendElement.SVG_FEBLEND_MODE_SCREEN   = 3;
  /*unsigned short SVGFEBlendElement.SVG_FEBLEND_MODE_DARKEN   = 4;
  /*unsigned short SVGFEBlendElement.SVG_FEBLEND_MODE_LIGHTEN  = 5;*/

base.$1.upsvg("feGaussianBlur")
 .on("initialize",  function () {
  /*readonly SVGAnimatedString*/ this.in1 = base("$SVGAnimatedString").up();
  /*readonly SVGAnimatedNumber*/ this.stdDeviationX = base("$SVGAnimatedNumber").up();
  /*readonly SVGAnimatedNumber*/ this.stdDeviationY = base("$SVGAnimatedNumber").up();
  this._fpsa = SVGFilterPrimitiveStandardAttributes(this);
} )
 /*void*/ .setStdDeviation = function(/*float*/ stdDeviationX, /*float*/ stdDeviationY ) {

};

base.$1.upsvg("cursor")
 .on("initialize",  function () {
  /*readonly SVGAnimatedLength*/ this.x = new SVGAnimatedLength();
  /*readonly SVGAnimatedLength*/ this.y = new SVGAnimatedLength();
  SVGURIReference.apply(this);
} );

base.$1.upsvg("a")
 .on("initialize", function (_doc) {
  this._tar = _doc.createElement("a");
  _doc = void 0;
  /*readonly SVGAnimatedString*/ this.target = base("$SVGAnimatedString").up();
  this.target.baseVal = "_self";
  this.addEventListener("DOMAttrModified", function(evt){
    var tar = evt.target;
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    if (evt.attrName === "target") {
      tar.target.baseVal = evt.newValue;
    } else if (evt.attrName === "xlink:title") {
      tar._tar.setAttribute("title", evt.newValue);
    }
    evt = void 0;
  }, false);
  this.addEventListener("DOMNodeInserted", function(evt){
    var tar = evt.target;
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tnext = tar.nextSibling,
    sar = tar._tar,
    spar = tar.parentNode._tar,
    snext = null;
    if (sar && spar) {
      if (!tnext) {
        spar.appendChild(sar);
      } else {
        while(tnext) {
          if (tnext._tar && tnext._tar.parentNode) {
            /*use要素や実体参照は_tarプロパティをもっていないので、無視する*/
            snext = tnext._tar;
            break;
          }
          tnext = tnext.nextSibling;
        }
        snext && (spar = snext.parentNode);
        spar.insertBefore(sar, snext);
      }
    }
    tnext = sar = spar = snext = void 0;
    var txts = tar._tar.style;
    txts.cursor = "hand";
    txts.left = "0px";
    txts.top = "0px";
    txts.textDecoration = "none";
    txts = void 0;
    var t = tar.target.baseVal,
        st = "replace";
    if (t === "_blank") {
      st = "new";
    }
    tar.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:show", st);
    tar._tar.style.color = tar.ownerDocument.defaultView.getComputedStyle(tar, "").getPropertyValue("fill");
    tar = evt = void 0;
  }, false);
  this.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
    var tar = evt.target;
    if (!!tar._tar && (tar.nodeType === /*Node.ELEMENT_NODE*/ 1)) {
      var txts = tar._tar.style;
      txts.cursor = "hand";
      txts.textDecoration = "none";
      txts = void 0;
    }
    tar = evt = void 0;
    return; //強制終了させる
  }, true);
  this.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
    var tar = evt.target;
    tar._tar.setAttribute("target", tar.target.baseVal);
    if (tar.href.baseVal.indexOf(".svg") !== -1) { //もし、リンク先がSVGファイルならば
      tar.addEventListener("click", function(evt){
          var tar = evt.target,
              sd = document.body,
              ob, nd;
          sd.lastChild.innerHTML = "<object data='" +tar.href.baseVal.split("#")[0]+ "' width='" +screen.width+ "' height='" +screen.height+ "' type='image/svg+xml'></object>";
          if (tar.target.baseVal === "_self") {
            nd = tar.ownerDocument._iframe;
            nd.parentNode.insertBefore(sd.lastChild.firstChild, nd);
            ob = nd.nextSibling;
            if (ob && (ob.tagName === "OBJECT")) {
              nd.previousSibling.setAttribute("width", ob.getAttribute("width"));
              nd.previousSibling.setAttribute("height", ob.getAttribute("height"));
              nd.parentNode.removeChild(ob);
            }
            ob = NAIBU._search([nd.previousSibling]);
            nd.parentNode.removeChild(nd);
          } else {
            sd.appendChild(sd.lastChild.firstChild);
            while (sd.firstChild !== sd.lastChild) {     //オブジェクト要素以外を除去
              sd.removeChild(sd.firstChild);
            }
            ob = NAIBU._search([sd.lastChild]);
          }
          try{
            NAIBU.doc = new ActiveXObject("MSXML2.DomDocument");
          } catch (e) {}
          evt.preventDefault();
          ob._next = {
            _init: (function (ob) {
              return (function(){
                document.title = ob.getSVGDocument().title;
                ob = void 0;
              });
            })(ob)
          };
          ob._init();
          sd = ob = nd = void 0;
      }, false);
    }
    tar = void 0;
  }, false);
  SVGURIReference.apply(this);
} );

base.$1.upsvg("view")
 .on("initialize",  function () {
  /*readonly SVGStringList*/ this.viewTarget = base("$SVGStringList").up();
      //SVGFitToViewBoxのインターフェースを用いる
  /*readonly SVGAnimatedRect*/   this.viewBox = new SVGAnimatedRect();
  /*readonly SVGAnimatedPreserveAspectRatio*/ this.preserveAspectRatio = new SVGAnimatedPreserveAspectRatio();
  /*unsigned short*/             this.zoomAndPan = /*SVGZoomAndPan.SVG_ZOOMANDPAN_DISABLE*/ 1;
} );

base.$1.upsvg("script")
 .on("initialize",  function () {
  /*DOMString*/ this.type;
  SVGURIReference.apply(this);
  this.addEventListener("DOMAttrModified", function(evt){
    if (evt.attrName === "type") {
      evt.target.type = evt.newValue;
    }
    evt = void 0;
  }, false);
  this.addEventListener("S_Load", function(evt){
    var tar = evt.target, script = tar._text;
    var tod = tar.ownerDocument;
    NAIBU._temp_doc = tod;
    script = script.replace(/function\s+([^\s\(]+)\(/g, "document.$1 || (document.$1 = $1);function $1(");
    script = "with({NAIBU:NAIBU, document:NAIBU._temp_doc, window:this}){(function(){" +script+ "\n})();}";
    try {
      NAIBU.eval(script);
    } catch (e) { //IE9では、documentがconstとして定数指定されているため、引数として指定できない
      script = script.replace(/([^a-zA-Z])document\./g, "$1NAIBU._temp_doc.");
      NAIBU.eval(script);
    }
    tar = evt = script = void 0;
  }, false);
  this.addEventListener("DOMNodeInserted", function(evt){
    var tar = evt.target,
        cur;
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      if (tar.data && /[a-z]/.test(tar.data)) { //CharacterDataノードならば
        cur = evt.currentTarget;
        cur._text = tar.data;
        evt = tar.ownerDocument.createEvent("SVGEvents");
        evt.initEvent("S_Load", false, false); //このinitEventメソッドでcurrentTargetは初期化
        cur.dispatchEvent(evt);
      }
      evt= tar = cur = void 0;
      return;
    }
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
      var tar = evt.target;
      if (evt.eventPhase === /*Event.AT_TARGET*/ 2 && !tar.getAttributeNodeNS("http://www.w3.org/1999/xlink", "xlink:href")) {
        var evtt = tar.ownerDocument.createEvent("SVGEvents");
        evtt.initEvent("S_Load", false, false);
        evt.currentTarget.dispatchEvent(evtt);
      }
      tar = evt = evtt = void 0;
    }, false);
  }, false);
} );

base("$event").up("SVGEvents");

base("$event").SVGZoomEvents = base("$event").UIEvents.up("SVGZoomEvents").on("itnitialize", function() {
  /*readonly SVGRect*/  this.zoomRectScreen = base("$SVGRect").up();
  /*readonly float*/    this.previousScale =  this.newScale = 1;
  /*readonly SVGPoint*/ this.previousTranslate = base("$SVGPoint").up();
  /*readonly SVGPoint*/ this.newTranslate = base("$SVGPoint").up();
});

base.$1.upsvg("animate")
 .SVGAnimationElement = function() {
  /*SIEにおけるSVGElementでは、fill属性とStyleSheetを結びつける機構があるため、
   *styleのsetPropertyメソッドを無効化させておく必要がある
   */
  this.style.setProperty = function(){};
  this._tar = null;
  /*readonly SVGElement*/ this.targetElement;
  /*それぞれのプロパティは、_を除いた属性に対応している*/
  this._begin = this._end = this._repeatCount = this._repeatDur = this._dur = this._resatrt = null;
  this._currentFrame = 0;
  /*_isRepeatと_numRepeatは繰り返し再生のときに使う。なお、後者は現在のリピート回数*/
  this._isRepeat = false;
  this._numRepeat = 0;
  /*_isStartプロパティは一度は起動したかどうか*/
  this._isStarted = false;
  /*_startと_finishプロパティはミリ秒数のリストを収納する。
   *_startはアニメ開始時の秒数リスト。_finishはアニメ終了時の秒数のリスト。
   *なお、文書読み込み終了時（アニメ開始時刻）の秒数を0とする。
   *_startingプロパティは現在アニメーションでの開始時刻。getSartTimeメソッドで使う
   */
  this._start = this._finish = this._starting = null;
  /*_activeDurプロパティは現時点でのアニメーションの活動期間*/
  this._activeDur = 0;
  this._from = this._to = this._values = this._by = null;
  this._keyTimes = null;
  this.addEventListener("beginEvent", function(evt) {
    try {
      var tar = evt.target,
      begin = tar.getStartTime(),
      durv = tar._dur,
      dur = tar._getOffset(durv),
      end = tar._finish,
      endv= tar._end,
      td = tar._repeatDur,
      tc = tar._repeatCount,
      ac = null;
      if (end) {
        for (var i=0, eli=end.length;i<eli;++i) {
          /*endの配列（ソース済み）からbeginに最も近い数値を選ぶ*/
          if (end[i] >= begin) {
            end = end[i];
            break;
          }
        }
      } else {
        /*イベント待ちの場合は、endの値を、indefiniteとみなす。参照: http://www.w3.org/TR/smil-animation/#ComputingActiveDur
         *
         * 3.3.4. Computing the active duration
         *
         * If the value of end cannot be resolved (e.g. when it is event-based),
         * the value is considered to be "indefinite" for the purposes of evaluating the active duration.
         *
         */
        endv = null;
      }
      /*Activate Duration (活性持続時間と呼ぶことにする)を計算
       *計算方法は以下を参照のこと
       *http://www.w3.org/TR/smil-animation/#ComputingActiveDur
       *3.3.4. Computing the active duration
       */
      var endbegin = end - begin;
      /*tar._getOffset(td)はtdの値によってはエラーとなるため、最適化できないことに注意*/
      if ((td === "indefinite") || (tc === "indefinite")) {
        ac = (endv) ?
            endbegin :
          /*活性持続時間が不定（indefinite)なので、強制的にアニメを終了させる*/
          null;
      } else if (durv === "indefinite") {
        ac = (!tc && !endv) ?
          /*活性持続時間が不定（indefinite)なので、強制的にアニメを終了させる*/
           null
         : (tc && !endv) ?
           tar._getOffset(td)
         : (!tc && endv) ?
           endbegin
         : (tar._getOffset(td) > endbegin) ?
          tar._getOffset(td)
         : endbegin;
      } else {
        ac =  (durv && !td && !tc && !endv) ?
           dur
         : (durv && !td && tc && !endv) ?
           dur * (+tc)
         : (durv && td && !tc && !endv) ?
           tar._getOffset(td)
         : (durv && !td && !tc && endv && (dur > endbegin)) ?
           dur
         : ((durv && !td && !tc && endv) && (dur <= endbegin)) ?
           endbegin
         : (durv && td && tc && !endv && (+tc*dur > tar._getOffset(td))) ?
           +tc*dur
         : (durv && td && tc && !endv && (+tc*dur <= tar._getOffset(td))) ?
           tar._getOffset(td)
         : (durv && td && tc && endv && (+tc*dur > Math.min(+td, endbegin))) ?
           +tc*dur
         : (durv && td && tc && endv && (+tc*dur <= Math.min(+td, endbegin))) ?
           Math.min(tar._getOffset(td), endbegin)
         : (durv && td && !tc && endv && (tar._getOffset(td) > endbegin)) ?
           tar._getOffset(td)
         :  (durv && td && !tc && endv && (tar._getOffset(td) <= endbegin)) ?
           endbegin
         : (durv && !td && tc && endv && (+tc*dur > endbegin)) ?
           +tc*dur
         : (durv && !td && tc && endv && (+tc*dur <= endbegin)) ?
           endbegin
         : null;
      }
    } catch (e) {
      tar.endElementAt(1);
      throw new DOMException(/*DOMException.INVALID_STATE_ERR*/ 11);
    }
    if ((ac || (ac === 0)) && isFinite(ac)) {
      /*endの値がすでにある場合は、二重指定を避ける*/
      endv || tar.endElementAt(ac);
      tar._activeDur = ac;
    }
    tar = begin = dur = durv = end = endv = td = tc = ac = endbegin = void 0;
  }, false);
  this.addEventListener("DOMAttrModified", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return;
    }
    var tar = evt.target,
        name = evt.attrName,
        evtv = evt.newValue;
    if (name === "begin") {
      tar._begin = evtv.replace(/\s+/g, "").split(";"); //空白は取り除く
    } else if (name === "end") {
      tar._end = evtv.replace(/\s+/g, "").split(";");
    } else if (name === "dur") {
      tar._dur = evtv;
    } else if (name === "repeatCount") {
      tar._repeatCount = evtv;
      tar._isRepeat = true;
    } else if (name === "repeatDur") {
      tar._repeatCount = evtv;
      tar._isRepeat = true;
    } else if (name === "from") {
      tar._from = evtv;
    } else if (name === "to") {
      tar._to = evtv;
    } else if (name === "values") {
      tar._values = evtv.split(";");
    } else if (name === "by") {
      tar._by = evtv;
    } else if (name === "keyTimes") {
      var s = evtv.split(";");
      tar._keyTimes = []; //_keyTimesプロパティを初期化
      for (var i=0;i<s.length;++i) {
        tar._keyTimes[i] = parseFloat(s[i]);
      }
      s = void 0;
    } else if (name === "restart") {
      tar._restart = evtv;
    }
    evt = evtv = void 0;
  }, false);
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target;
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
      var tar = evt.target;
      /*以降の場合分けルールに関しては、下記の仕様を参照
       *http://www.jsa.or.jp/stdz/instac/syoukai/H13/H13annual_report/12/ngc-wg3/offline/smil_20_20020131/animation.html#AnimationNS-FromToBy
       */
      if (tar._values) {
      } else if (tar._from && tar._to) {
        tar._values = [tar._from, tar._to];
      } else if (tar._from && tar._by) {
        var n = parseFloat(tar._from) + parseFloat(tar._by), tanni = tar._from.match(/\D+/) || [""];
        tar._values = [tar._from, n+tanni[0]];
      } else if (tar._to) {
        tar._values = [null, tar._to];
      } else if (tar._by) {
        tar._values = [null, null, tar._by];
      } else if (!tar.hasChildNodes() && !tar.hasAttributeNS(null, "path")) { //animateMotion要素に留意
        /*アニメーションの効果が出ないように調整する
         *SMILアニメーションの仕様を参照
         *
         *>if none of the from, to, by or values attributes are specified, the animation will have no effect
         *「3.2.2. Animation function values」より引用
         *http://www.w3.org/TR/2001/REC-smil-animation-20010904/#AnimFuncValues
         */
        return tar;
      }
      /*begin属性とend属性を処理する*/
      var that = tar,
          timing = function(val, name, offset) {
        /*timing関数は時間のタイミングをidとeventと、clock-value(offset)に分割して処理していく
         *まず、idを検出するためのsearcIdローカル関数を作る
         */
        var searchId = function () {
              var n = val.indexOf(".");
              if ((n > 0) && (/[a-z]/i).test(val.charAt(n+1))) { //. (dot)の後がアルファベットならば
                return (val.slice(0, n));
              }
              n = nn = void 0;
              return "";
            },
            id;
        /*
         *W3CのSMIl AnimationのTimingモデルは7パターンがあるので、場合分けする
         */
        if (isFinite(parseFloat(val))) { //1) offset-valueの場合
          that[name](offset);
        } else if (val.indexOf("repeat(") > -1) { //2) repeat-valueの場合
          var inte = parseFloat(val.slice(7)),
              ds = (function(that, name, offset) {
                return function (evt) {
                   if (inte === evt.target._numRepeat) {
                     that[name](offset);
                   }
                };
              })(that, name, offset),
              id = searchId();
              if (id) {
                that.ownerDocument.getElementById(id).addEventListener("repeatEvent", ds);
              } else {
                that.addEventListener("repeatEvent", ds);
              }
        } else if (/\.(begin|end)/.test(val)) { //3) syncbase-valueの場合
          id = searchId();
          if (id) {
            var ds = (function(that, name, offset) {
                  return function (evt) {
                    that[name](offset);
                  };
                })(that, name, offset),
                ev = "";
            /\.(begin|end)/.test(val); //RegExp.$1のために、もう一度する必要がある
           if (RegExp.$1 === "begin") {
              ev = "beginEvent";
            } else if (RegExp.$1 === "end") {
              ev = "endEvent";
            }
            that.ownerDocument.getElementById(id).addEventListener(ev, ds, false);
          }
        } else if (val.indexOf("wallclock(") === 0) { //4) wallclock-valueの場合

        } else if (val === "indefinite") { //5) indefiniteの場合
        } else if (val.indexOf("accesskey(") > -1) { //6) accesskey-valueの場合

        } else { //7) event-valueの場合
          id = searchId();
          var ds = (function(that, name, offset) {
                return function (evt) {
                   that[name](offset);
                };
              })(that, name, offset);
          if (id && val.match(/\.([a-z]+)/i)) {
            that.ownerDocument.getElementById(id).addEventListener(RegExp.$1, ds);
          } else if (val){
            that.targetElement.addEventListener(val.match(/^[a-z]+/i)[0], ds);
          }
        }
        val = searchId = id = void 0;
      };
      if (tar._begin) {
        for (var i=0,tli=tar._begin.length;i<tli;++i) {
          timing(tar._begin[i], "beginElementAt", tar._getOffset(tar._begin[i]));
        }
      } else {
        tar.beginElementAt(0);
      }
      if (tar._end) {
        for (var i=0,tli=tar._end.length;i<tli;++i) {
          timing(tar._end[i], "endElementAt", tar._getOffset(tar._end[i]));
        }
      }
      that = void 0;
      if (tar.hasAttributeNS("http://www.w3.org/1999/xlink", "xlink:href")) {
        tar.targetElement = tar.ownerDocument.getElementById(tar.getAttributeNS("http://www.w3.org/1999/xlink", "xlink:href").slice(1));
      } else {
        tar.targetElement = tar.parentNode;
      }
      evt = tar = void 0;
    }, false);
    evt = tar = void 0;
  }, false);
  /*SVGAnimationElementのメソッドは初期化のときにつけることで高速化*/
  this.mix(function(t) {
  /*以下のメソッド（beginElementなど)については、
   *別モジュールであるsmil::ElementTimeControl(smil.js)を参照のこと
   */
  /*void*/ t.beginElement = function() {
    var ttd = this.ownerDocument,
        evt = ttd.createEvent("TimeEvents");
    this._starting = ttd.documentElement.getCurrentTime(); //getStartTimeメソッドで使う開始時刻
    if (this._isStarted && ((this._restart === "never")
        || ((this._restart === "whenNotActive") && (this.getCurrentTime() > 0)))) {
      return; //restart属性の設定により、再起動させないようにする
    }
    if (this.getCurrentTime() > 0) {
      /*アニメーションの最中で、beginEventが起きるときは、endEventが前もって起こされる。SVG1.1の仕様を参照
       *
       * 19.4.2 Interface TimeEvent
       * Note that if an element is restarted while it is currently playing, the element will raise an end event and another begin event, as the element restarts.
       *
       * http://www.w3.org/TR/SVG/animate.html#InterfaceTimeEvent
       *
       */
      this.endElement();
    }
    evt.initTimeEvent("beginEvent", ttd.defaultView, 0);
    this.dispatchEvent(evt);
    /*新しくリストの頭を更新して、別の値も実行させるようにする*/
    this._start && this._start.shift();
    this._isStarted = true;
    ttd = evt = void 0;
  };
  /*void*/ t.endElement = function() {
    var ttd = this.ownerDocument,
        evt = ttd.createEvent("TimeEvents");
    evt.initTimeEvent("endEvent", ttd.defaultView, 0);
    this.dispatchEvent(evt);
    this._finish && this._finish.shift();
    this._currentFrame = 0;
  };
  /*void*/ t.beginElementAt = function(/*float*/ offset) {
    var ntc = this.ownerDocument.documentElement.getCurrentTime(),
        start = this._start || [];
    for (var i=0,sli=start.length;i<sli;++i) {
      if (start[i] === (offset+ntc)) {
        ntc = start = offset = void 0;
        return;
      }
    }
    start.push(offset + ntc);
    start.sort(function(a, b) {
      return a - b;
    });
    this._start = start;
    ntc = start = offset = void 0;
  };
  /*void*/ t.endElementAt = function(/*float*/ offset) {
    var ntc = this.ownerDocument.documentElement.getCurrentTime(),
    fin = this._finish || [];
    for (var i=0,fli=fin.length;i<fli;++i) {
      if (fin[i] === (offset+ntc)) {
        ntc = fin = offset = void 0;
        return;
      }
    }
    fin.push(offset + ntc);
    fin.sort(function(a, b) {
      return a - b;
    });
    this._finish = fin;
    ntc = start = offset = void 0;
  };
  t._eventRegExp = /(mouse|activ|clic|begi|en)[a-z]+/;
  t._timeRegExp = /[\-\d\.]+(h|min|s|ms)?$/;
  t._unit = {
      "h"   : 3600000,
      "min" : 60000,
      "s"   : 1000
  };
  /*_getOffsetメソッド
   * どれだけズレの時間があるかを計測するメソッド
   *tに数値が使われていないときは0を返す
   *これはSMILアニメーションモジュールの以下の記述にあるように、値のデフォルトが0であることに起因する
   *http://www.w3.org/TR/2001/REC-smil20-20010807/smil-timing.html#Timing-Ex:0DurDiscreteMedia
   *http://www.w3.org/TR/2001/REC-smil20-20010807/smil-timing.html#Timing-DurValueSemantics
   ** Note that when the simple duration is "indefinite", some simple use cases can yield surprising results. See the related example #4 in Appendix B.
   */
  t._getOffset = function(/*string*/ val) {
    var t = null, //tは最初の数値
        n = [val.indexOf("+"), val.indexOf("-")],
        s;
    if (n[0] > -1) {
      s = val.slice(n[0]);
      t = parseFloat(s);
    } else if (n[1] > -1) {
      s = val.slice(n[1]);
      t = parseFloat(s);
    } else {
      s = val;
      t = parseFloat(val);
    }
    if (isFinite(t)) {
      if (/\d+\:(\d\d)\:([\d\.]+)$/.test(s)) { //Full-Clock-Valueの場合
        t = (t*3600 + parseInt(RegExp.$1, 10)*60 + parseFloat(RegExp.$2)) * 1000;
      } else if (/\d\d\:([\d\.]+)$/.test(s)) {
        t = (t*60 + parseFloat(RegExp.$1)) * 1000;
      } else if (/(h|min|s)$/.test(s)) {
        t *= this._unit[RegExp.$1];
      }
      if (isFinite(t)) {
         t *= 0.8;
        return t;
      }
    }
    return 0;
  };
  
  /*float*/ t.getStartTime = function(){
    if (this._starting || (this._starting === 0)) {
      return (this._starting);
    } else {
      throw new DOMException(/*DOMException.INVALID_STATE_ERR*/ 11);
    }
  };
  /*getCurrentTimeメソッド
   *現在の時間コンテナ内での時刻であり、
   *決して現在時刻ではない。要素のbeginイベントの発火したときが0sである。
   */
  /*float*/ t.getCurrentTime = function(){
    return (this._currentFrame * 125 * 0.8);
  };
  /*float*/ t.getSimpleDuration = function(){
      if (!this._dur && !this._finish && (this._dur === "indefinite")) {
        throw new DOMException(/*DOMException.NOT_SUPPORTED_ERR*/ 9);
      } else {
        return (this._getOffset(this._dur));
      }
    };
  });
};
                    //raises( DOMException );
NAIBU.Time = {
  currentFrame : 0,
  Max : 17000,
  start : function() {
  if (NAIBU.Clip.length > 0) {
    screen.updateInterval = 42; //24fpsとして描画処理
    window.onscroll = function () {
      screen.updateInterval = 0;
      screen.updateInterval = 42;
    };
    NAIBU.stop = setInterval( (function() {
      try {
        var ntc = NAIBU.Time.currentFrame,
            nc = NAIBU.Clip,
            s = ntc * 100; //フレーム数ntcをミリ秒数sに変換 (100 = 125 * 0.8)
        if (ntc > NAIBU.Time.Max) {
          clearInterval(NAIBU.stop);
        }
        nc[0] && nc[0].ownerDocument.documentElement.setCurrentTime(s);
        for (var i=0,ncli=nc.length;i<ncli;++i) {
          var nci = nc[i],
              s2 = s + 100,
              s1 = s - 100;
          if (nci._start) {
              var sti = nci._start[0];
              if (sti && nci._finish && (sti === nci._finish[0])) { //アニメーションの途中ならば
                nci.endElement();
              }
              if ((sti || (sti === 0)) && (s1 <= sti) && (sti < s)) {
                nci.beginElement();
              }
              sti = void 0;
          }
          if (nci._isRepeat && (nci.getCurrentTime() >= nci.getSimpleDuration()*nci._numRepeat)) {
            /*リピート処理*/
            var ttd = nci.ownerDocument,
                evt = ttd.createEvent("TimeEvents");
            ++nci._numRepeat;
            evt.initTimeEvent("repeatEvent", ttd.defaultView, nci._numRepeat);
            nci.dispatchEvent(evt);
            ttd = evt = void 0;
          }
          if (nci._finish && (nci.getCurrentTime() !== 0)) {
              var fti = nci._finish[0];
              if ((fti || (fti === 0)) && (s1 <= fti) && (fti <= s)) {
                nci.endElement();
              }
              fti = void 0;
          }
          if (nci._frame) {
            ++nci._currentFrame;
            nci._frame();
          }
        }
        ++NAIBU.Time.currentFrame;
        ntc = nc = s = nci = s1 = s2 = void 0;
      } catch (e) {
      }
    }),
    1
   );
  } else {
      window.onscroll = function () {
        screen.updateInterval = 0;
        window.onscroll = NAIBU.emptyFunction;
      };
  }
 }
};
NAIBU.Clip = [];


base.$1["http://www.w3.org/2000/svganimate"]
 .on("initialize", function (_doc) {
  this.SVGAnimationElement();
  /*NAIBU.Clipについては、NAIBU.Timeで使う
   *くわしくはNAIBU.Time.start関数のコードを参照
   */
  NAIBU.Clip[NAIBU.Clip.length] = this;
  /*_valueListプロパティは、
   *機械が理解できる形で保管されているvalueの値の配列リスト
   */
  this._valueList = [];
  this._isDiscrete = false;
  this.addEventListener("DOMAttrModified", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    if ((evt.attrName === "calcMode") && (evt.newValue === "discrete")) {
      evt.target._isDiscrete = true;
    }
  }, false);
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target;
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
      var tar = evt.target,
          attrName = tar.getAttributeNS(null, "attributeName"),
          ttr = tar.targetElement,
          tta = ttr[attrName];
      /*tar.valuesのリスト:  ["12px", "13px"]
       *tar._valueList:   [(base("$SVGPoint").up()), (base("$SVGPoint").up())]
       *  tar.valuesを機械が理解できるように変換したものがtar._valueList
       *この_valueListプロパティはアニメの際に使うので、_valuesプロパティはアニメ中に使わないことに注意
       */
      var vi = ttr.cloneNode(false);
      if (!tar._values[0]) {   //to属性か、by属性が設定されている場合
        var ttrs = ttr.ownerDocument.defaultView.getComputedStyle(ttr, "");
        tar._values[0] = ttr.getAttributeNS(null, attrName) || ttrs.getPropertyValue(attrName);
        if (!tar._values[1] && tar._values[2]) { //by属性のみが設定されている場合
          var v2 = parseFloat(tar._values[0]) + parseFloat(tar._values[2]), tanni = tar._values[0].match(/\D+/) || [""];
          tar._values[1] = v2 + tanni[0];
          tar._values.pop();
          v2 = tanni = void 0;
        }
      }
      if (("animatedPoints" in ttr) && (attrName === "points")) {
        ttr.animatedPoints = vi.points;
        for (var i=0, tav=tar._values, tvli=tav.length;i<tvli;++i) {
          var vir = ttr.cloneNode(false);
          vir._tar = void 0;
          vir.setAttributeNS(null, "points", tav[i]);
          tar._valueList[tar._valueList.length] = vir.points;
        }
      } else if (!!tta) {
        tta.animVal = vi[attrName].baseVal;
        for (var i=0, tav=tar._values, tvli=tav.length;i<tvli;++i) {
          var vir = ttr.cloneNode(false); //仮の要素
          vir._tar = void 0;
          vir.setAttributeNS(null, attrName, tav[i]);
          tar._valueList[tar._valueList.length] = vir[attrName].baseVal;
        }
      } else if (!!CSS2Properties[attrName] || attrName.indexOf("-") > -1) { //スタイルシートのプロパティならば
        for (var i=0, tav=tar._values, tvli=tav.length;i<tvli;++i) {
          if ((attrName === "fill") || (attrName === "stroke") || (attrName === "stop-color")) {
            tar._valueList[i] = base("$CSSValue").$SVGColor.$SVGPaint._new$();
            tar._valueList[i].setPaint(1, null, tav[i], null);
          } else {
            tar._valueList[i] = parseFloat(tav[i]);
          }
        }
      } else if (("normalizedPathSegList" in ttr) && (attrName === "d")) {
        ttr.animatedNormalizedPathSegList = vi.normalizedPathSegList;
        for (var i=0, tav=tar._values, tvli=tav.length;i<tvli;++i) {
          var vir = ttr.cloneNode(false);
          vir._tar = void 0;
          vir.setAttributeNS(null, "d", tav[i]);
          tar._valueList[tar._valueList.length] = vir.normalizedPathSegList;
        }
      } else {
        vi = void 0;
        return;
      }
      evt = tta = vir = vi = void 0;
    }, false);
  }, false);
  this.addEventListener("beginEvent", function(evt) {
    var _tar = evt.target,
        attrName = _tar.getAttributeNS(null, "attributeName"),
        newAttr = _tar.targetElement.attributes.getNamedItemNS(null, attrName),
        ttr = _tar.targetElement,
        tta = ttr[attrName];
    _tar._frame = function() {
      var tar = _tar,
          d = tar._isRepeat ? tar.getSimpleDuration() : tar._activeDur,
          n = tar._valueList.length-1,
          tg = tar.getCurrentTime();
      tar._activeDur || (d = 0);
      d *= 0.8;
      if ((n !== -1) && (d !== 0) && (tg <= d)) {
        if (tar._isDiscrete) {
          ++n; //discreteモードは他のモードに比べて、分割数が多いことに注意
        }
        var ii = Math.floor((tg*n) / d);
        if (ii === n) { //iiが境い目のときは、n-2を適用
          ii -= 1;
        }
      } else {
        return;
      }
      /*setAttrbute(NS)メソッドはDOM属性を書き換えるため利用しない。
      *
      * 参照：アニメーションサンドイッチモデル
      * >アニメーションが起動している時,それは実際,DOMの中の属性値は変化しない。
      *http://www.jsa.or.jp/stdz/instac/syoukai/H13/H13annual_report/12/ngc-wg3/offline/smil_20_20020131/animation.html#animationNS-AnimationSandwichModel
      */
      var evt = tar.ownerDocument._domnodeEvent();
      if (tar._keyTimes) {
        var di = (tar._keyTimes[ii+1] - tar._keyTimes[ii]) * d;
        var ti = tar._keyTimes[ii];
      } else {
        var di = d / n; //keyTimesがなければ均等に時間を配分しておく
        var ti = ii / n;
      }
      if (("animatedPoints" in ttr) && (attrName === "points")) {
        var base = ttr.points;
        ttr.points = ttr.animatedPoints;
        ttr.dispatchEvent(evt);
        ttr.animatedPoints = ttr.points;
        ttr.points = base;
      } else if (!!tta) {
        var base = tta.baseVal, tanim = tta.animVal;
        var v1 = tar._valueList[ii].value;
        /*vを求める公式に関しては、SMIL2.0 Animation Moduleの単純アニメーション関数の項を参照
         * 3.4.2 Specifying the simple animation function f(t)
         *http://www.w3.org/TR/2005/REC-SMIL2-20050107/animation.html#animationNS-SpecifyingAnimationFunction
         */
        if (!tar._isDiscrete) {
          var v2 = tar._valueList[ii+1].value, v = v1 + (v2-v1) * (tg-ti*d) / di;
        } else {
          var v = v1;
        }
        tanim.newValueSpecifiedUnits(base.unitType, v);
        tta.baseVal = tanim;
        tanim = void 0;
        ttr.dispatchEvent(evt);
        /*変化値はanimValプロパティに収納しておき、
         *変化する前の、元の値はbaseValプロパティに再び収納しておく
         */
        tta.animVal = tta.baseVal;
        tta.baseVal = base;
        di = void 0;
      } else if (!!CSS2Properties[attrName] || attrName.indexOf("-") > -1) { //スタイルシートのプロパティならば
        var base = null;
        var v1 = tar._valueList[ii].value, v2 = tar._valueList[ii+1].value;
        if (!tar._isDiscrete) {
          var v = v1 + (v2-v1) * (tg-ti*d) / di;
        } else {
          var v = v1;
        }
      } else if (("normalizedPathSegList" in ttr) && (attrName === "d")) {
        var base = ttr.normalizedPathSegList;
        ttr.normalizedPathSegList = ttr.animatedNormalizedPathSegList;
        ttr.dispatchEvent(evt);
        ttr.animatedNormalizedPathSegList = ttr.normalizedPathSegList;
        ttr.normalizedPathSegList = base;
      }
     evt = tar = v1 = v2 = v = d = n = ii = tg = void 0;
    };
    evt = vir = void 0;
  }, false);
  this.addEventListener("endEvent", function(evt) {
    var tar = evt.target,
        fill = tar.getAttributeNS(null, "fill");
    if (!fill || (fill === "remove")) {
      var evt = tar.ownerDocument._domnodeEvent();
      tar.targetElement.dispatchEvent(evt);
      evt = void 0;
      tar._frame && tar._frame();
    }
    tar._frame = void 0;
  }, false);
  this.addEventListener("repeatEvent", function(evt) {
    var tar = evt.target;
  }, false);
} );

/*set要素はanimate要素を流用する*/
base.$1["http://www.w3.org/2000/svgset"] = base.$1["http://www.w3.org/2000/svganimate"].up()
 .on("initialize", function (_doc) {
  this.SVGAnimationElement();
  NAIBU.Clip[NAIBU.Clip.length] = this;
  this._to = "";
  this.addEventListener("DOMAttrModified", function(evt) {
    var tar = evt.target, name = evt.attrName;
    if (name === "to") {
      tar._to = evt.newValue;
    }
    tar = name = void 0;
  }, false);
  this.addEventListener("beginEvent", function(evt) {
    var tar = evt.target;
    tar._currentFrame = 1; //これがないと、NAIBU.stopの内部の処理の都合上、endEventが発動しない。
    if (tar.targetElement) {
      var attrName = tar.getAttributeNS(null, "attributeName"),
          newAttr = tar.targetElement.attributes.getNamedItemNS(null, attrName),
          tta = tar.targetElement[attrName];
      if (!!CSS2Properties[attrName] || attrName.indexOf("-") > -1) { //スタイルシートのプロパティならば
        /*前もって、スタイルシートの値を取得しておいて、endEventの際に使う*/
        tar._prestyle = tar.ownerDocument.defaultView.getComputedStyle(tar.targetElement, "").getPropertyValue(attrName);
        var style = tar.ownerDocument.getOverrideStyle(tar.targetElement, "");
        style.setProperty(attrName, tar.getAttributeNS(null, "to"), null);
        style = void 0;
      } else if (!!tta) {
        var base = tta.baseVal;
        if (base instanceof SVGLength) {
          tta.baseVal = tar.ownerDocument.documentElement.createSVGLength();
        } else if (base instanceof SVGRect) {
          tta.baseVal = tar.ownerDocument.documentElement.createSVGRect();
        }
        /*setAttrbute(NS)メソッドはDOM属性を書き換えるため利用しない。
         *
         * 参照：アニメーションサンドイッチモデル
         * >アニメーションが起動している時,それは実際,DOMの中の属性値は変化しない。
         *http://www.jsa.or.jp/stdz/instac/syoukai/H13/H13annual_report/12/ngc-wg3/offline/smil_20_20020131/animation.html#animationNS-AnimationSandwichModel
         */
        var evt = tar.ownerDocument.createEvent("MutationEvents");
        evt.initMutationEvent("DOMAttrModified", true, false, newAttr, newAttr, tar._to, attrName, /*MutationEvent.MODIFICATION*/ 1);
        tar.targetElement.dispatchEvent(evt);
        evt = void 0;
        /*変化値はanimValプロパティに収納しておき、
         *変化する前の、元の値はbaseValプロパティに再び収納しておく
         */
        tta.animVal = tta.baseVal;
        tta.baseVal = base;
      }
    }
    evt = tar = attrName = void 0;
  }, false);
  this.addEventListener("endEvent", function(evt) {
    var tar = evt.target,
        fill = tar.getAttributeNS(null, "fill");
    if (!fill || (fill === "remove")) {
      var attrName = tar.getAttributeNS(null, "attributeName"),
          style = tar.ownerDocument.getOverrideStyle(tar.targetElement, "");
      if (tar._prestyle) { //スタイルシートの変更ならば
        style.setProperty(attrName, tar._prestyle, null);
      } else {
        var evtt = tar.ownerDocument._domnodeEvent();
        tar.targetElement.dispatchEvent(evtt);
      }
      attrName = style = evtt = void 0;
    }
    tar = fill = void 0;
  }, false);
  this.addEventListener("repeatEvent", function(evt) {
    var tar = evt.target, attrName = tar.getAttributeNS(null, "attributeName"), style = tar.ownerDocument.defaultView.getComputedStyle(tar.targetElement, "");
  }, false);
} );

/*animateMotion要素はanimate要素を流用する*/
base.$1["http://www.w3.org/2000/svganimateMotion"] = base.$1["http://www.w3.org/2000/svganimate"].up()
 .on("initialize", function (_doc) {
  this.SVGAnimationElement();
  NAIBU.Clip[NAIBU.Clip.length] = this;
  this.addEventListener("DOMAttrModified", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return;
    }
    var tar = evt.target,
        name = evt.attrName;
    if (name === "path") {
      var d = tar.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
      d.setAttributeNS(null, "d", evt.newValue);
      tar._path = d;
      d = void 0;
    }
  }, false);
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target;
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
      var vlist = [],
          ti;
      if (tar._values) {
        for (var i=0, tav=tar._values, tvli=tav.length;i<tvli;++i) {
          ti = tav[i];
          ti = ti.split(",");
          vlist[i] = [+ti[0], +ti[1]];
        }
        tar._valueList = vlist;
      }
    }, false);
  }, false);
  this.addEventListener("beginEvent", function(evt) {
    var tar = evt.target,
        trans = tar.targetElement.transform;
    /*アニメーション中に変化すべき値をanimValプロパティに入力して、
     *baseValと同じような値に設定。
     */
    trans.animVal = base("$SVGStringList").$SVGTransformList.up();;
    if (trans.baseVal.numberOfItems !== 0) {
      trans.animVal.initialize(trans.baseVal.createSVGTransformFromMatrix(trans.baseVal.consolidate().matrix));
    } else {
      trans.animVal.appendItem(tar.ownerDocument.documentElement.createSVGTransform());
    }
    tar._frame = function() {
      var _tar = tar,
          tpn = _tar._path,
          tgsd = _tar._isRepeat ? _tar.getSimpleDuration() : _tar._activeDur,
          d = tgsd * 0.8,
          tg = _tar.getCurrentTime(),
          ii;
      _tar._activeDur || (d = 0);
      if (tgsd === 0) {
         tgsd = void 0;
         return;
      }
      if (tpn) { //path属性が指定されていた場合、tpnは属性値となる
        var st = tpn.getTotalLength() * tg / d, //stは現在に至るまでの距離
            p = tpn.getPointAtLength(st),
            trans = _tar.targetElement.transform;
        trans.animVal.getItem(trans.animVal.numberOfItems-1).setTranslate(p.x, p.y);
        var base = trans.baseVal;
        trans.baseVal = trans.animVal;
        _tar.targetElement._cacheMatrix = null;
        var evtt = _tar.ownerDocument.createEvent("MutationEvents");
        evtt.initMutationEvent("DOMNodeInsertedIntoDocument", false, false, null, null, null, null, null);
        _tar.targetElement.dispatchEvent(evtt);
        trans.baseVal = base;
        evtt = base = trans = st = p = void 0;
      } else if (tar._valueList) {
        var total = 0, //totalは総距離
            st = 0,    //stは現在にいたるまでの距離
            tav = tar._valueList,
            n = tav.length - 1;
        if ((n !== -1) && (d !== 0) && (tg <= d)) {
          ii = Math.floor((tg*n) / d);
          if (ii === n) { //iiが境い目のときは、n-2を適用
            ii -= 1;
          }
        } else {
          return;
        }
        for (var i=1, tvli=tav.length;i<tvli;i+=2) {
          total += Math.sqrt(Math.pow(tav[i][1] - tav[i-1][1], 2) + Math.pow(tav[i][0] - tav[i-1][0], 2));
        }
        for (var i=1;i<ii;i+=2) {
          st += Math.sqrt(Math.pow(tav[i][1] - tav[i-1][1], 2) + Math.pow(tav[i][0] - tav[i-1][0], 2));
        }
        var p = tar.ownerDocument.documentElement.createSVGPoint(),
            trans = _tar.targetElement.transform;
        st = (st / total) * d;
        p.x = tav[ii][0] + (tav[ii+1][0] - tav[ii][0]) * (tg - st) / d;
        p.y = tav[ii][1] + (tav[ii+1][1] - tav[ii][1]) * (tg - st) / d;
        trans.animVal.getItem(trans.animVal.numberOfItems-1).setTranslate(p.x, p.y);
        var base = trans.baseVal;
        trans.baseVal = trans.animVal;
        _tar.targetElement._cacheMatrix = void 0;
        var evtt = _tar.ownerDocument.createEvent("MutationEvents");
        evtt.initMutationEvent("DOMNodeInsertedIntoDocument", false, false, null, null, null, null, null);
        _tar.targetElement.dispatchEvent(evtt);
        trans.baseVal = base;
        evtt = base = trans = st = p = i = void 0;
      }
    };
    evt = trans = tpn = tgsd = void 0;
  }, false);
  this.addEventListener("endEvent", function(evt) {
    var tar = evt.target,
        trans = tar.targetElement.transform,
        fill = tar.getAttributeNS(null, "fill"),
        tavli = tar._valueList,
        tb;
    if (!fill || (fill === "remove")) {
      /*アニメが開始される前の状態に戻す*/
      var evtt = tar.ownerDocument._domnodeEvent();
      tar.targetElement.dispatchEvent(evtt);
      tar._frame && tar._frame();
    } else {
      /*_frame関数で終了位置に会わないことがあるので、以下の処理で位置を修正*/
      trans.animVal.getItem(trans.animVal.numberOfItems-1).setTranslate(tavli[tavli.length-1][0], tavli[tavli.length-1][1]);
      tb = trans.baseVal;
      trans.baseVal = trans.animVal;
      var evtt = tar.ownerDocument._domnodeEvent();
      tar.targetElement.dispatchEvent(evtt);
      trans.baseVal = tb;
    }
    tar._frame = evt = evtt = trans = fill = tar = tavli = tb = void 0;
  }, false);
  this.addEventListener("repeatEvent", function(evt) {
    var tar = evt.target;
  }, false);
} );

base.$1.upsvg("mpath")
 .on("initialize", function () {
/* :
                SVGElement,
                SVGURIReference,
                SVGExternalResourcesRequired*/ 
  SVGURIReference.apply(this);
} );

/*animateColor要素はanimate要素を流用する*/
base.$1["http://www.w3.org/2000/svganimateColor"] = base.$1["http://www.w3.org/2000/svganimate"].up()
 .on("initialize", function (_doc) {
  this.SVGAnimationElement();
  NAIBU.Clip[NAIBU.Clip.length] = this;
  this._valueList = [];
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    var tar = evt.target;
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
      var tar = evt.target,
          attrName = tar.getAttributeNS(null, "attributeName"),
          ttr = tar.targetElement,
          fstyle = tar.ownerDocument.defaultView.getComputedStyle(ttr, ""),
          css, n;
      if (!tar._values[0]) {
        tar._values[0] = fstyle.getPropertyValue(attrName);
      }
      for (var i=0, tav=tar._values, tvli=tav.length;i<tvli;++i) {
        var to = base("$CSSValue").$SVGColor._new$();
        if (tar._values[i] === "currentColor") {
          to.setRGBColor(fstyle.getPropertyValue("color") || "black");
        } else if (tar._values[i] === "inherit") {
          /*いったん、cssValueTypeプロパティをinheritに指定して、継承元のオブジェクトを取得*/
          css = fstyle.getPropertyCSSValue(attrName);
          n = css.cssValueType;
          css.cssValueType = /*CSSValue.CSS_INHERIT*/ 0;
          to = fstyle.getPropertyCSSValue(attrName);
          css.cssValueType = n;
        } else {
          to.setRGBColor(tar._values[i]);
        }
        tar._valueList[tar._valueList.length] = to;
        to = void 0;
      }
      tar = ttr = fstyle = css = n = attrName = void 0;
    }, false);
  }, false);
  this.addEventListener("beginEvent", function(evt) {
    var tar = evt.target,
        attrName = tar.getAttributeNS(null, "attributeName"),
        style = tar.ownerDocument.getOverrideStyle(tar.targetElement, ""),
        fstyle = tar.ownerDocument.defaultView.getComputedStyle(tar.targetElement, "");
    tar._frame = function() {
      var _tar = tar;
      /*公式に関しては、SMIL2.0 Animation Moduleの単純アニメーション関数の項を参照
       * 3.4.2 Specifying the simple animation function f(t)
       *http://www.w3.org/TR/2005/REC-SMIL2-20050107/animation.html#animationNS-SpecifyingAnimationFunction
       */
      var d = _tar._isRepeat ? _tar.getSimpleDuration() : _tar._activeDur,
          n = _tar._valueList.length - 1,
          tg = _tar.getCurrentTime(),
          ii, di, ti;
      _tar._activeDur || (d = 0);
      d *= 0.8;
      if ((n !== -1) && (d !== 0) && (tg <= d)) {
        ii = Math.floor((tg*n) / d);
        if (ii === n) { //iiが境い目のときは、n-2を適用
          ii -= 1;
        }
      } else {
        return;
      }
      if (tar._keyTimes) {
        di = (tar._keyTimes[ii+1] - tar._keyTimes[ii]) * d;
        ti = tar._keyTimes[ii];
      } else {
        di = d / n; //keyTimesがなければ均等に時間を配分しておく
        ti = ii / n;
      }
      var fc = _tar._valueList[ii].rgbColor,
          tc = _tar._valueList[ii+1].rgbColor,
          durd = (tg-ti*d) / di,
          num = /*CSSPrimitiveValue.CSS_NUMBER*/ 1,
          fr = fc.red.getFloatValue(num),
          fg = fc.green.getFloatValue(num),
          fb = fc.blue.getFloatValue(num),
          r = fr + (tc.red.getFloatValue(num) - fr) * durd,
          g = fg + (tc.green.getFloatValue(num) - fg) * durd,
          b = fb + (tc.blue.getFloatValue(num) - fb) * durd;
      style.setProperty(attrName, "rgb(" +Math.ceil(r)+ "," +Math.ceil(g)+ "," +Math.ceil(b)+ ")", null);
      _tar = d = n = tg = fc = tc = fr = fg = fb = num = r = g = b = ii = void 0;
    };
    tar._frame();
  }, false);
  this.addEventListener("endEvent", function(evt) {
    var tar = evt.target,
        fill = tar.getAttributeNS(null, "fill");
    if (!fill || (fill === "remove")) {
      var evtt = tar.ownerDocument._domnodeEvent();
      tar.targetElement.dispatchEvent(evtt);
      tar._frame && tar._frame();
    }
    tar._frame = evt = evtt = tar = fill = void 0;
  }, false);
  this.addEventListener("repeatEvent", function(evt) {
    var tar = evt.target;
  }, false);
} );

/*animateTransform要素はanimate要素を流用する*/
base.$1["http://www.w3.org/2000/svganimateTransform"] = base.$1["http://www.w3.org/2000/svganimate"].up()
 .on("initialize", function (_doc) {
  this.SVGAnimationElement();
  NAIBU.Clip[NAIBU.Clip.length] = this;
  this.addEventListener("beginEvent", function(evt) {
    var tar = evt.target, trans = tar.targetElement.transform;
    /*アニメーション中に変化すべき値をanimValプロパティに入力して、
     *baseValと同じような値に設定。
     */
    trans.animVal = base("$SVGStringList").$SVGTransformList.up();
    if (trans.baseVal.numberOfItems !== 0) {
      trans.animVal.initialize(trans.baseVal.createSVGTransformFromMatrix(trans.baseVal.getItem(0).matrix));
    }
    trans.animVal.appendItem(tar.ownerDocument.documentElement.createSVGTransform());
  }, false);
  this.addEventListener("endEvent", function(evt) {
    var tar = evt.target,
        fill = tar.getAttributeNS(null, "fill");
    if (!fill || (fill === "remove")) {
      var evtt = tar.ownerDocument._domnodeEvent();
      tar.targetElement.dispatchEvent(evtt);
      tar._frame && tar._frame();
    }
    tar._frame = evt = evtt = tar = fill = void 0;
  }, false);
  this.addEventListener("repeatEvent", function(evt) {
    var tar = evt.target;
  }, false);
} );

base.$1.upsvg("font").on("initialize",  function ()  /*:
                SVGElement,
                SVGExternalResourcesRequired,
                SVGStylable*/ {
  /*_isExternalは外部から呼び出されたfont要素ならば、真(1)となる*/
  /*boolean or number*/ this._isExternal = 0;
  this.addEventListener("DOMNodeInserted", function(evt){
    var tar = evt.target;
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return;
    }
    tar.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
      var tar = evt.target, svgns = "http://www.w3.org/2000/svg", fontFace = tar.getElementsByTagNameNS(svgns, "font-face").item(0);
      var nefunc = function(evt){
        var svg = evt.target;
        /*以下のtarはfont要素*/
        var familyName = fontFace.getAttributeNS(null, "font-family");
        var textElements = tar.ownerDocument.getElementsByTagNameNS(svgns, "text");
        for (var i=0,_tar=tar,tli=textElements.length;i<tli;++i) {
          var ti = textElements[i], style = _tar.ownerDocument.defaultView.getComputedStyle(ti, '');
          if (style.getPropertyValue("font-family", null).indexOf(familyName) > -1) {
            NAIBU._noie_createFont(ti, _tar, true);
          }
        }
        evt = tar = svg = curt = textElments = svgns = _tar = void 0;
      };
      if (!fontFace.__isLinked || tar._isExternal) {
        tar.ownerDocument.documentElement._svgload_limited = 0;
        tar.ownerDocument.documentElement.addEventListener("SVGLoad", nefunc, false);
      }
    }, false);
  }, false);
} );

base.$1.upsvg("glyph"); /*:
                SVGElement,
                SVGStylable*/

base.$1.upsvg("missingGlyph"); /*:
                SVGElement,
                SVGStylable*/

base.$1.upsvg("hkern");
base.$1.upsvg("kkern");

base.$1.upsvg("font-face").on("initialize", function () {
  /*boolean(or number)*/ this._isLinked = 0;
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      if (evt.target.localName === "font-face-uri") { //外部リンクがあれば
        evt.currentTarget._isLinked = 1;
      }
      return; //強制終了させる
    }
  }, false);
} );

base.$1.upsvg("font-face-src");

base.$1.upsvg("font-face-uri").on("initialize", function () {
  this.addEventListener("DOMNodeInserted", function(evt){
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    evt.target.ownerDocument.documentElement._svgload_limited--;
    evt.target.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:show", "embed");
  }, false);
  this.addEventListener("S_Load", function(evt){
    var tar = evt.target, tpp = tar.parentNode.parentNode.parentNode;
    if (tpp.localName === "defs") {
      tpp = tar.parentNode.parentNode; //tppをfont-face要素としておく
    }
    tar._instance._isExternal = 1;
    tpp.parentNode.appendChild(tar._instance);
    evt = tar = tpp = void 0;
  }, false);
  SVGURIReference.apply(this);
} );

base.$1.upsvg("font-face-format");

base.$1.upsvg("font-face-name");

base.$1.upsvg("definitionSrc");

base.$1.upsvg("foreignObject")
 .on("initialize",  function (_doc) { /*:
                SVGElement,
                SVGTests,
                SVGLangSpace,
                SVGExternalResourcesRequired,
                SVGStylable,
                SVGTransformable,
                events::EventTarget*/
  this._tar = _doc.createElement("v:group");
  var sl = SVGAnimatedLength;
  /*readonly SVGAnimatedLength*/ this.x = new sl();
  /*readonly SVGAnimatedLength*/ this.y = new sl();
  /*readonly SVGAnimatedLength*/ this.width = new sl();
  /*readonly SVGAnimatedLength*/ this.height = new sl();
  sl = void 0;
  this.addEventListener("DOMNodeInserted", function(evt){
    var tar = evt.target;
    if (evt.eventPhase === /*Event.BUBBLING_PHASE*/ 3) {
      return; //強制終了させる
    }
    tar._inserted__(tar);
    tar.addEventListener("DOMNodeInsertedIntoDocument", this["http://www.w3.org/2000/svgimage"]._imageo, false);
    evt = tar = void 0;
  }, false);
  this.addEventListener("DOMNodeInsertedIntoDocument", function(evt){
    if(evt.eventPhase === /*Event.CAPTURING_PHASE*/ 1) {
      var tar = evt.target;
      if ((tar.nodeType === /*Node.ELEMENT_NODE*/ 1)
             && !tar._tar && tar.namespaceURI ==="http://www.w3.org/1999/xhtml") {
        if ("html|body|head".indexOf(tar.localName) > -1) {
          tar._tar = _doc.createElement("div");
          tar._tar.appendChild(_doc.createElement("v:shape"));
        } else {
          tar._tar = _doc.createElement(tar.localName);
          if (tar.localName === "div") {
            /*v:shape要素が入っていないdiv要素はテキスト処理に使うため、v:shape要素を挿入して回避*/
            tar._tar.appendChild(_doc.createElement("v:shape"));
          }
        }
      } else if ((tar.nodeType === /*Node.TEXT_NODE*/ 3) && !tar._tar) {
        tar._tar = _doc.createTextNode(tar.data);
      }
      var tnext = tar.nextSibling,
          sar = tar._tar,
          spar = tar.parentNode._tar,
          snext = null;
      if (sar && spar) {
        if (!tnext) {
          spar.appendChild(sar);
        } else {
          while(tnext) {
            if (tnext._tar && tnext._tar.parentNode) {
              /*use要素や実体参照は_tarプロパティをもっていないので、無視する*/
              snext = tnext._tar;
              break;
            }
            tnext = tnext.nextSibling;
          }
          snext && (spar = snext.parentNode);
          spar.insertBefore(sar, snext);
        }
      }
      tnext = sar = spar = snext = void 0;
      var ta = tar.attributes;
      if (tar._tar) {
        for (var i=0;i<ta.length;++i) {
          tar._tar.setAttribute(ta[i].localName, ta[i].nodeValue);
        }
      }
      var isRect = true;
      if (tar._tar.lastChild) {
        if (tar._tar.lastChild.nodeName !== "rect") {
          isRect = false;
        }
      } else {
        isRect = false;
      }
      if (!isRect) {
        var backr = _doc.createElement("v:rect"),
            backrs = backr.style; //ずれを修正するためのもの
        backrs.width = backrs.height = "1px";
        backrs.left = backrs.top = "0px";
        backr.stroked = backr.filled = "false";
        tar._tar.appendChild(backr);
      }
      tar = ta = void 0;
    }
  }, true);
} );

//#endif  _SVG_IDL_

NAIBU._fontSearchURI = function(evt){
  var doc = evt.target.ownerDocument;
  var tsrc = doc.getElementsByTagNameNS("http://www.w3.org/2000/svg", "font-face-uri");
  for (var i=0;i<tsrc.length;++i) {
    var src = tsrc[i].getAttributeNS("http://www.w3.org/1999/xlink", "href"),
        ids = src.split(":")[1],
        xmlhttp = NAIBU.xmlhttp;
    xmlhttp.open("GET", src.replace(/#.+$/, ""), true);
    xmlhttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlhttp.onreadystatechange = function() {
      if ((xmlhttp.readyState === 4)  &&  (xmlhttp.status === 200)) {
        var doce = (new DOMParser()).parseFromString(xmlhttp.responseText, "text/xml");
        NAIBU._font({document:doce, docu:doc, id:ids});
        xmlhttp = doc = doce = void 0;
      }
    };
    xmlhttp.send(null);
  }
};
/*_font関数は、SVGFontで使う*/
NAIBU._font = function (data) {
  var doc = data.document, svgns = "http://www.w3.org/2000/svg";
  //getElementByIdは使えないので注意（DOMParserを使った場合、DTDでの指定が必要）
  var font = doc.getElementsByTagNameNS(svgns, "font").item(0);
  var familyName = font.getElementsByTagNameNS(svgns, "font-face").item(0).getAttributeNS(null, "font-family");
  if (familyName && (font.getAttributeNS(null, "id") === data.id)) {
    var textElements = data.docu.getElementsByTagNameNS(svgns, "text");
    for (var i=0,tli=textElements.length;i<tli;++i) {
      var ti = textElements[i], style = data.docu.defaultView.getComputedStyle(ti, '');
      if (style.getPropertyValue("font-family", null).indexOf(familyName) > -1) {
        NAIBU._noie_createFont(ti, font, false);
      }
    }
  }
  doc = data = void 0;
};
NAIBU._noie_createFont = function(/*Element*/ ti, /*Element*/ font, /*boolean*/ isMSIE) {
  var style = ti.ownerDocument.defaultView.getComputedStyle(ti, ''),
      svgns = "http://www.w3.org/2000/svg",
      //isTategakiは縦書きならば真
      isTategaki = ti.getAttributeNS(null, "writing-mode") || ti.parentNode.getAttributeNS(null, "writing-mode"),
      horizOrVert = isTategaki ? "vert-adv-y" : "horiz-adv-x",
      node = ti.firstChild, data, glyphs = font.getElementsByTagNameNS(svgns, "glyph"),
      em = parseFloat(font.getElementsByTagNameNS(svgns, "font-face").item(0).getAttributeNS(null, "units-per-em") || 1000),
      advX = parseFloat( (font.getAttributeNS(null, horizOrVert) || em) ), //字幅の設定
      dx = parseFloat(ti.getAttributeNS(null, "x") || 0),
      dy = parseFloat(ti.getAttributeNS(null, "y") || 0),
      fontSize = parseFloat(style.getPropertyValue("font-size")),
      fe = fontSize / em,
      ds = false, npdlist = ["fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-opacity",
  "opacity",
  "cursor"];
  if (glyphs.length > 60) { //fail safe
    return;
  }
  if (/a/[-1] === 'a') { //Firefoxならば
    ds = true;
  } else if (isMSIE || isTategaki) {
    ds = true;
  }
  if (ds){
     while(node) {
      if (!glyphs) {
        break;
      }
      data = node.data;
      if (data !== void 0) { //dataがある場合
        var advanceX = [], glyphData = [];
        for (var i=0,gli=glyphs.length;i<gli;++i) {
          var glyph = glyphs[i], unicode = glyph.getAttributeNS(null, "unicode") || "なし"; //unicode属性に指定がない場合、処理させないようにする
          var orientation = glyph.getAttributeNS(null, "orientation"), isVert = true, isOrientationAttribute = true;
          if (orientation) {
            if (orientation === "h") {
              isVert = false;
            }
          } else {
            isOrientationAttribute = false;
          }
          if ( (isTategaki && isVert) || !(isTategaki || isVert) || !isOrientationAttribute){
            //indexは該当する文字が何番目にあるかの数字
            var index = data.indexOf(unicode);
            while (index > -1) {
              advanceX[index] = parseFloat(glyph.getAttributeNS(null, horizOrVert) || advX); //字幅を収納
              glyphData[index] = glyph.getAttributeNS(null, "d");
              index = data.indexOf(unicode, index+1);
            }
          }
        }
        for (var i=0,adv=0;i<data.length;++i) {
          if (advanceX[i] !== void 0) { //配列に含まれていれば
            var path = ti.ownerDocument.createElementNS(svgns, "path");
            //advance、すなわち字幅の長さ分、ずらしていく
            var matrix = ti.ownerDocument.documentElement.createSVGMatrix();
            matrix.a = fe;
            matrix.d = -fe;
            for (var j=0;j<npdlist.length;++j){
              var nj = npdlist[j],
                  tg = ti.getAttributeNS(null, nj) || style.getPropertyValue(nj);
              if (nj === "stroke-width") {
                tg = style.getPropertyCSSValue(nj).getFloatValue(1) / fe;
                tg += "";
              }
              if (tg) {
                path.setAttributeNS(null, nj, tg);
              }
            }
            if (isTategaki) {
              var y= dy + adv*fe, x = dx;
              if ("、。".indexOf(data.charAt(i)) > -1) { //句読点の場合
                var fms = fontSize / Math.SQRT2;
                x += fms;
                y -= fms;
                fms = void 0;
              }
              matrix.e = x;
              matrix.f = y;
            } else {
              matrix.e = dx + adv*fe;
              matrix.f = dy;
            }
            path.setAttributeNS(null, "transform", "matrix(" +matrix.a+ "," +matrix.b+ "," +matrix.c+ "," +matrix.d+ "," +matrix.e+ "," +matrix.f+ ")");
            path.setAttributeNS(null, "d", glyphData[i]);
            ti.parentNode.insertBefore(path, ti);
            adv += advanceX[i];
            matrix = void 0;
          }
        }
        adv = advanceX = glyphData = void 0;
      } else if ("tspan|a".indexOf(node.localName) > -1){
        NAIBU._noie_createFont(node, font, isMSIE);
      }
      node = node.nextSibling;
    }
    if (isMSIE) {
      var style = ti.ownerDocument.getOverrideStyle(ti, null);
      style.setProperty("visibility", "hidden");
      style = void 0;
    } else {
      ti.setAttributeNS(null, "opacity", "0");
    }
  }
  data = isTategaki = horizOrVert = em = advX = dx = dy = fontSize = style = svgns = node = void 0;
};

/*以下は、getComputedStyleメソッドで使うために、CSS2Propertiesの_listプロパティに、
 *CSSprimitiveValueのリストを収納している。なお、その際に、writingModeなどはwriting-modeに変更している
 */
(function(){
  var s = base("$CSSStyleDeclaration")._new$(),
      slis = s._list,
      n = 0,
      regAZ = /([A-Z])/,
      regm = /\-/,
      u, t;
  for (var i in CSS2Properties) {
    if(CSS2Properties.hasOwnProperty(i)) {
      t = i.replace(regAZ, "-");
      if (!!RegExp.$1) {
        u = "-" +RegExp.$1.toLowerCase();
      } else {
        u = "-";
      }
      t = t.replace(regm, u);
      s.setProperty(t, CSS2Properties[i]);
      slis[t] = slis[n]; //この処理はCSSモジュールのgetComputedStyleメソッドのため
      slis[n]._isDefault = 1;
      ++n;
      i = t = u =  void 0;
    }
  }
  slis._opacity = 1;
  slis._fontSize = 12;
  CSS2Properties._list = slis;
  base("$document").defaultView._defaultCSS = slis;
  s = n = regAZ = regm = slis =null;
})();

NAIBU.addEvent = function(evt,lis){
  if (window.addEventListener) {
    window.addEventListener(evt, lis, false);
  } else if (window.attachEvent) {
    window.attachEvent('on'+evt, lis);
  } else {
    window['on'+evt] = lis;
  }
  //Sieb用
  if (sieb_s) {
    lis();
  }
};

function unsvgtovml() {
  try {
    if ("stop" in NAIBU) {
      clearInterval(NAIBU.stop);
    }
    window.onscroll = NAIBU.emptyFunction;
    window.detachEvent("onload", NAIBU._main);
    NAIBU.freeArg();
    base.free();
    base = Object._create = CSS2Properties = NAIBU.xmlhttp = NAIBU = STLog =  void 0;
    Array = ActiveXObject = void 0;
  } catch(e) {}
}
/*_main関数
 *一番最初に起動するべき関数
 */
NAIBU._main = function() {
  var xmlhttp,         //XMLHttpオブジェクトを生成
      _doc = document; //documentのエイリアスを作成
  try {
    if (XMLHttpRequest) {
      xmlhttp = false;
    } else {
      xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    }
  } catch (e) {
    try {
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    } catch (E) {
      xmlhttp = false;
    }
  }
  if (!xmlhttp) {
    try {
      xmlhttp = new XMLHttpRequest();
    } catch (e) {
      xmlhttp = false;
    }
  }
  NAIBU.xmlhttp = xmlhttp;
  var nd,
      docn = _doc.namespaces;
  if (docn && !docn["v"]) {
    try {
      NAIBU.doc = new ActiveXObject("MSXML2.DomDocument");
    } catch (e) {

    }
    nd = NAIBU.doc;
    docn.add("v","urn:schemas-microsoft-com:vml");
    docn.add("o","urn:schemas-microsoft-com:office:office");
    var st = _doc.createStyleSheet(),
        vmlUrl = "behavior: url(#default#VML);display: inline-block;} "; //inline-blockはIEのバグ対策
    st.cssText = "v\\:rect{" +vmlUrl+ "v\\:image{" +vmlUrl+ "v\\:fill{" +vmlUrl+ "v\\:stroke{" +vmlUrl+ "o\\:opacity2{" +vmlUrl
      + "dn\\:defs{display:none}"
      + "v\\:group{text-indent:0px;position:relative;width:100%;height:100%;" +vmlUrl
      + "v\\:shape{width:100%;height:100%;" +vmlUrl;
  }
  var ary = _doc.getElementsByTagName("script");
  //kares, save svgify element here
  var done = [];
  //全script要素をチェックして、type属性がimage/svg+xmlならば、中身をSVGとして処理する
  for (var i=0; ary[i]; ++i) {
    var ai = ary[i],
        hoge = ai.type;
    if (ai.type === "image/svg+xml") {
      var ait = ai.text;
      if (sieb_s && ait.match(/&lt;svg/)) {
        //ソース内のタグを除去
        ait = ait.replace(/<.+?>/g, "");
        //エンティティを文字に戻す
        ait = ait.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
      }
      if (NAIBU.isMSIE) {
        var gsd = new GetSVGDocument(ai);
        gsd.xmlhttp = {
          readyState : 4,
          status : 200,
          responseText : ait.replace(/\shref=/g, " target='_top' xlink:href=")
        };
        gsd._ca();
      } else {
        var base = location.href.replace(/\/[^\/]+?$/,"/"); //URIの最後尾にあるファイル名は消す。例: /n/sie.js -> /n/
        ait = ait.replace(/\shref=(['"a-z]+?):\/\//g, " target='_top' xlink:href=$1://").replace(/\shref=(.)/g, " target='_top' xlink:href=$1"+base);
        var s = NAIBU.textToSVG(ait,ai.getAttribute("width"),ai.getAttribute("height"));
        ai.parentNode.insertBefore(s,ai);
      }
      //kares add
      done.push(ai);
      ai = ait = void 0;
    }
    hoge = void 0;
  }
  //kares remove those svgify element
  for (var j=0; done[j]; ++j) {
      done[j].parentNode && done[j].parentNode.removeChild && done[j].parentNode.removeChild(done[j]);
  }

  //kares
  //NAIBU.doc = nd;
  nd = docn = ary = void 0;
  if (xmlhttp && NAIBU.isMSIE) {
    if (!!_doc.createElementNS && !!_doc.createElementNS( "http://www.w3.org/2000/svg", "svg").createSVGRect) { //IE9ならば
    } else { //IE6-8ならば
      var ob = _doc.getElementsByTagName("object"),
          s=[],
          t = [],
          _search = function(_ob) {
            var ifr, obi, n,
                w = "width",
                h = "height";
            s || (s = []);             //NAIBU._searchで呼ばれたときに必要
            _doc || (_doc = document);
            for (var i=0;_ob[i];++i) {
              obi = _ob[i];
              s[s.length] = new GetSVGDocument(obi);
              ifr = _doc.createElement("iframe");
              ifr.style.cssText = obi.style.cssText;
              ifr.style.background = "black";
              n = obi.getAttribute(w);
              n && ifr.setAttribute(w, n);
              n = obi.getAttribute(h);
              n && ifr.setAttribute(h, n);
              ifr.marginWidth = ifr.marginHeight = "0px"; //このマージン設定がないと、全体がずれてしまう
              ifr.scrolling = "no";
              ifr.frameBorder = "0";
             /*iframe要素を使って、描画のプロセスを分離する
              *したがって、_docはdocumentとは別のオブジェクトとなる
              */
              obi.parentNode.insertBefore(ifr, obi);
            }
            i = obi = ifr = _ob = w = h = void 0;
            return s[s.length-1];
          };
      _search(ob);
      var img = _doc.getElementsByTagName("img"),
          em = _doc.getElementsByTagName("embed");
      for (var i=0,j=0;img[i];++i) {
        /*img要素の処理*/
        if (img[i].getAttribute("src").indexOf(".svg") > -1) { //拡張子があればSVG画像と判断
          t[j] = img[i];
          ++j;
        }
      }
      _search(t);
      _search(em);
      NAIBU._search = _search; //a要素がクリックされたときに使う関数
      ob = em = t = img = _search = void 0;
      for (var i=0;i<s.length;++i) {
        /*あとで変数iが使われるために、次の条件分岐が必要*/
        if (i < s.length-1) {
          s[i]._next = s[i+1];
        }
      }
      if (i > 0) {
        s[0]._init(); //初期化作業を開始
      }
      s = void 0;
    }
  } else {
    //kares, we don't use font here
    return;
    var ob = _doc.getElementsByTagName("object");
    for (var i=0;i<ob.length;++i) {
      if (ob[i].contentDocument) {
        NAIBU._fontSearchURI({target:{ownerDocument:ob[i].contentDocument}});
      } else if (ob[i].getSVGDocument) {
        ob[i].getSVGDocument()._docElement.addEventListener("SVGLoad", NAIBU._fontSearchURI, false);
      } else {
      }
    }
  }
  xmlhttp = _doc = void 0;
};
NAIBU.addEvent("load", NAIBU._main);
NAIBU.utf16 = function ( /*string*/ s)  {
  return unescape(s);
};
NAIBU.unescapeUTF16 = function ( /*string*/ s) {
  return s.replace(/%u\w\w\w\w/g,  NAIBU.utf16);
};
//Text2SVG機能。SVGのソース（文章）をSVG画像に変換できる。
NAIBU.textToSVG = function ( /*string*/ source, /*float*/ w, /*float*/ h) {
  /*Safari3.xでは、DOMParser方式だと、文字が表示されないバグがあるため、
   *dataスキーム方式を採用する
   */
  if (navigator.userAgent.indexOf('WebKit') > -1 || navigator.userAgent.indexOf('Safari') > -1) { //WebKit系ならば
    var data = 'data:image/svg+xml;charset=utf-8,' + NAIBU.unescapeUTF16(escape(source));
    var ob = document.createElement("object");
    ob.setAttribute("data",data);
    ob.setAttribute("width",w);
    ob.setAttribute("height",h);
    ob.setAttribute("type","image/svg+xml");
    return ob;
  } else {
    var doc = (new DOMParser()).parseFromString(source, "text/xml");
    return (document.importNode(doc.documentElement, true));
  }
};
NAIBU.addEvent("unload", unsvgtovml);
//IEならばtrue
NAIBU.isMSIE = /*@cc_on!@*/false;