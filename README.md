# Asciidoc comments

Render asciidoc to html making each block addressable.

Use the bookmarklet below to select text and get back an exact url and the highlighted text on the clipboard for pasting into communications.




![Asciidoc comments](demo.png)

To process your AsciiDoc files into html with an id for each block:

```bash
npm i -g @techwriter/asciidoc-comments
asciidoc-comments <filename>.adoc
```


To add the bookmarklet, drag the following link into your browser bookmarks bar:

<a class="bookmarklet" href="javascript:(function()%7Bjavascript%3A(function%20hello()%7Blet%20titleText%20%3D%20document.title%3Blet%20selStuff%20%3D%20document.getSelection()%3Blet%20elementSelected%20%3D%20selStuff.anchorNode.parentElement%3Blet%20commentid%20%3D%20elementSelected.getAttribute('id')%3Bwhile(!commentid%20%26%26%20elementSelected)%20%7Blet%20prevElement%20%3D%20elementSelected%3BelementSelected%20%3D%20elementSelected.previousElementSibling%20%3Bif(!elementSelected)%7BelementSelected%20%3D%20prevElement.parentElement%3B%7Dcommentid%20%20%3D%20elementSelected.getAttribute('id')%3B%7Dlet%20myUrl%20%3D%20document.location%3BmyUrl%20%3D%20myUrl.toString()%3Bif(commentid)%7Blet%20result%20%3D%20myUrl.indexOf(%22%23%22)%3Bif%20(result%20%3C%200)%20%7Bresult%20%3D%20myUrl.length%7D%3BmyUrl%20%3D%20myUrl.substr(0%2Cresult)%3BmyUrl%20%3D%20myUrl%2B%22%23%22%2Bcommentid%3B%7Dlet%20selText%20%3D%20selStuff.toString()%2B%22%22%3Bif%20(selText.length%20!%3D%200)%7BselText%20%3D%20%22%5Cn%3E%20%22%2BselText%3B%7D%3Bnavigator.clipboard.writeText(%22%5B%22%2BtitleText%2B%22%7C%22%2BmyUrl%2B%22%5D%22%2BselText%2B%22%22)%3Breturn%20false%7D())%7D)()">CommentCapture</a>

Alternatively, use the [bookmarklet source](./bookmarklet.js) to install a bookmarklet at https://mrcoles.com/bookmarklet/.