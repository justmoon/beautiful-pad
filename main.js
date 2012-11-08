var marked = require("marked");
var highlight = require("highlight").Highlight;
var fs = require("fs");
var path = require("path");
var gui = require('nw.gui');

var cleanState = "";
var isDirty = false;
var currentFile = null;

// Setup menu
var menubar = new gui.Menu({type: 'menubar'});
var filemenu = new gui.Menu();
filemenu.append(new gui.MenuItem({label: 'New', click: newFile}));
filemenu.append(new gui.MenuItem({label: 'Open...', click: openFile}));
filemenu.append(new gui.MenuItem({ type: 'separator' }));
filemenu.append(new gui.MenuItem({label: 'Save', click: saveFile}));
filemenu.append(new gui.MenuItem({label: 'Save As...', click: saveFileAs}));
filemenu.append(new gui.MenuItem({label: 'Revert', click: revertFile}));
filemenu.append(new gui.MenuItem({ type: 'separator' }));
filemenu.append(new gui.MenuItem({label: 'Quit'}));
var helpmenu = new gui.Menu();
helpmenu.append(new gui.MenuItem({label: 'About', click: showAbout}));
menubar.append(new gui.MenuItem({label: 'File', submenu: filemenu}));
menubar.append(new gui.MenuItem({label: 'Help', submenu: helpmenu}));
gui.Window.get().menu = menubar;

// Setup editor
var editor = ace.edit("editor");
var session = editor.getSession();
editor.setFontSize(15);
var MarkdownMode = ace.require("ace/mode/markdown").Mode;
loadFile("welcome.md");
session.setMode(new MarkdownMode());
session.setUseWrapMode(true);
function updatePreview() {
  var code = editor.getSession().getValue();
  setDirty(cleanState !== code);
  code = marked(code);
  code = highlight(code, false, true);
  document.getElementById('preview').innerHTML = code;
};
editor.on('change', updatePreview);
updatePreview();

function newFile() {
  closeFile();
  currentFile = null;
  cleanState = "";
  revertFile();
};

function openFile() {
  var chooser = $('#fileOpenDialog');
  chooser.trigger('click');
  chooser.change(function () {
    loadFile($(this).val());
  });
};

function loadFile(filepath) {
  currentFile = filepath;
  cleanState = fs.readFileSync(filepath, "utf-8");
  revertFile();
};

function closeFile() {
  if (isDirty) {
    var result = prompt("You have unsaved changes, are you sure you want to discard them?");
    if (!result) return;
  }
};

function revertFile() {
  session.setValue(cleanState);
  setDirty(false);
};

function saveFile() {
  if (currentFile === null) {
    saveFileAs();
  } else {
    var code = editor.getSession().getValue();
    console.log(currentFile);
    fs.writeFileSync(currentFile, code);
    cleanState = code;
    revertFile();
  }
};

function saveFileAs() {
  var chooser = $('#fileSaveAsDialog');
  chooser.trigger('click');
  chooser.change(function () {
    currentFile = $(this).val();
    saveFile();
  });
};

function setDirty(dirty) {
  isDirty = dirty;
  updateTitle();
  filemenu.items[3].enabled = dirty;
};

function updateTitle() {
  var title = null !== currentFile ? path.basename(currentFile) : "Empty";
  var win = gui.Window.get();
  win.title = (isDirty ? "* " : "") + title;
};

function showAbout() {
  var aboutCode = fs.readFileSync("about.md", "utf-8");
  var aboutHtml = '';
  aboutHtml += '<link rel="stylesheet" href="style/markdown.css" type="text/css"></link>';
  aboutHtml += '<div id="preview" style="text-align:center">'+marked(aboutCode)+'</div>';

  var jswin = window.open('about:blank', 'about', 'width=325,height=200');
  var nwwin = gui.Window.get(jswin);
  jswin.document.write(aboutHtml);
  nwwin.setResizable(false);

  centerWinOnWin(gui.Window.get(), nwwin);
};

function centerWinOnWin(winA, winB) {
  var centerX = winA.x + winA.width / 2;
  var centerY = winA.y + winA.height / 2;
  winB.x = centerX - winB.width / 2;
  winB.y = centerY - winB.height / 2;
};
