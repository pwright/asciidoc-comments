javascript:(
    function hello(){
        let titleText = document.title;
        let selStuff = document.getSelection();
        let elementSelected = selStuff.anchorNode.parentElement;
        let commentid = elementSelected.getAttribute('id');
        while(!commentid && elementSelected) {
            let prevElement = elementSelected;
            elementSelected = elementSelected.previousElementSibling ;
            if(!elementSelected){
                elementSelected = prevElement.parentElement;
            }
            commentid  = elementSelected.getAttribute('id');
        }
        let myUrl = document.location;
        myUrl = myUrl.toString();
        if(commentid){
            let result = myUrl.indexOf("#");
            if (result < 0) {
                result = myUrl.length
            };
            myUrl = myUrl.substr(0,result);

            myUrl = myUrl+"#"+commentid;
        }
        let selText = selStuff.toString()+"";
        if (selText.length != 0){
            selText = "\n> "+selText;
        };
        navigator.clipboard.writeText("["+titleText+"|"+myUrl+"]"+selText+"");
        return false
    }()
)
