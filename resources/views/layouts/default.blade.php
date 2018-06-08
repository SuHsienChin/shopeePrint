<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1 //EN"
"http://www.w3g.org/TR/xml11/DTD/xhtml11.dtd">
<html xmlns="'http://www.w3.org/1999/xhtml" xml:lang="zh-TW">
<head>
    @include('includes.head')
</head>
<body>
<div class="container">


    <div id="main" class="row">

            @yield('content')
            <div id="Footer" style="text-align:center; margin-bottom: 20px;">
	   			@include('includes.footer')
			</div>
    </div>


</div>
</body>
</html>