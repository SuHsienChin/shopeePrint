    var http_request = false;
    var tmp_divname = "";
     
    function makeRequest_common(url,divname,isparent,tmp_http_request) {
        tmp_http_request = false;
        if (window.XMLHttpRequest) { // Mozilla, Safari,...
            tmp_http_request = new XMLHttpRequest();

        } else if (window.ActiveXObject) { // IE
            try {
                tmp_http_request = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    tmp_http_request = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {}
            }
        }

        if (!tmp_http_request) {
            alert('Giving up :( Cannot create an XMLHTTP instance');
            return false;
        }
        tmp_http_request.onreadystatechange = function(){ alertContents_common(divname,isparent,tmp_http_request) }; 
        tmp_http_request.open('GET', url, true);
        tmp_http_request.send(null);
    }

    function makeRequest_common1(url,divname,isparent,tmp_http_request) {
        tmp_http_request = false;
        if (window.XMLHttpRequest) { // Mozilla, Safari,...
            tmp_http_request = new XMLHttpRequest();

        } else if (window.ActiveXObject) { // IE
            try {
                tmp_http_request = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    tmp_http_request = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {}
            }
        }

        if (!tmp_http_request) {
            alert('Giving up :( Cannot create an XMLHTTP instance');
            return false;
        }
        tmp_http_request.onreadystatechange = function(){ alertContents_common(divname,isparent,tmp_http_request) }; 
        tmp_http_request.open('POST', url, true);
        tmp_http_request.send(null);
    }

    function alertContents_common(divname,isparent,tmp_http_request) {
        if (tmp_http_request.readyState == 4) {
            if (tmp_http_request.status == 200) {
            	if (isparent){
                    parent.document.getElementById(divname).innerHTML = tmp_http_request.responseText;
                }else{
                	document.getElementById(divname).innerHTML = tmp_http_request.responseText;
                }
            } else {
                document.getElementById(divname).innerHTML = "ajax error";
            }
        }
    }