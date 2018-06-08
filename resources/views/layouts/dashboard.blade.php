<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1 //EN"
"http://www.w3g.org/TR/xml11/DTD/xhtml11.dtd">
<html xmlns="'http://www.w3.org/1999/xhtml" xml:lang="zh-TW">
<head>
    @include('includes.head')
</head>
<body class='contrast-brown' style="min-width:1080px;">
<header>
@include('includes.header')	
</header>


<!-- Navigation Start -->
<div id = "wrapper">
    <div id='main-nav-bg'>
    </div>
    <!-- Navigation Start -->
    <nav id='main-nav'>
    @include('includes.leftbar')
    </nav>
    <!-- Navigation End -->
    <!-- 內頁 -->
    <section id="content">
    	<div class="container">
    	@yield('content')
	    	<div id="Footer" class="noPrint" style="text-align:center; margin-bottom: 20px;">
	   			@include('includes.footer')
			</div>
		</div>	
    </section>
</div>


</body>
</html>