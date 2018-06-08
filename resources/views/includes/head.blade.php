    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <meta name="description" content="">
    <!--ajax form -->
    <meta name="_token" content="{!! csrf_token() !!}"/>
    <meta name="author" content="">
    <title>@yield('title')HR人事系統</title>
    <!-- Bootstrap core CSS -->
    <link href="{{URL::asset('assets/plugins/bootstrap-3.3.6-dist/css/bootstrap.min.css')}}" media="all" rel="stylesheet" type="text/css" />

    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css">

    <!-- Custom styles for this template -->
    {{-- <link href="{{ URL::asset('assets/css/jquery.bxslider.css')}}" rel="stylesheet"> --}}
    <link href="{{ URL::asset('assets/css/style.css') }}" rel="stylesheet">
    <link href="{{ URL::asset('assets/css/stylesheets/light-theme.css') }}" rel="stylesheet">
    <link href="{{ URL::asset('assets/css/stylesheets/theme-colors.css') }}" rel="stylesheet">
    <link href="{{ URL::asset('assets/plugins/fullcalendar-2.2.7-yearview/fullcalendar.min.css') }}" rel="stylesheet" />
    <link href="{{ URL::asset('assets/plugins/bootstrap-tagsinput/dist/bootstrap-tagsinput.css') }}" rel="stylesheet" />
    <link href="{{ URL::asset('assets/css/jquery.orgchart.css')}}" rel="stylesheet" type="text/css" >
    <link href="{{ URL::asset('assets/plugins/eonasdan-bootstrap-datetimepicker-4.17.37/css/bootstrap-datetimepicker.min.css')}}" rel="stylesheet" type="text/css" >
    <link href="{{ URL::asset('assets/css/stylesheets/select2.min.css')}}" rel="stylesheet" type="text/css" >
    <!-- / Start Template JS -->
    <script src="{{ URL::asset('assets/javascripts/jquery/jquery.min.js') }}" type="text/javascript"></script>

    <script src="{{ URL::asset('assets/javascripts/jquery/jquery.mobile.custom.min.js') }}" type="text/javascript"></script>
    <script src="{{ URL::asset('assets/javascripts/jquery/jquery-migrate.min.js') }}" type="text/javascript"></script>
    <script src="{{ URL::asset('assets/javascripts/jquery/jquery-ui.min.js') }}" type="text/javascript"></script>
    <script src="{{ URL::asset('assets/javascripts/plugins/jquery_ui_touch_punch/jquery.ui.touch-punch.min.js') }}" type="text/javascript"></script>
    <script src="{{ URL::asset('assets/javascripts/jquery.twzipcode.min.js') }}" type="text/javascript"></script>
    <script src="{{ URL::asset('assets/plugins/bootstrap-3.3.6-dist/js/bootstrap.min.js') }}" type="text/javascript"></script>
    <script src="{{ URL::asset('assets/javascripts/plugins/modernizr/modernizr.min.js') }}" type="text/javascript"></script>
    <script src="{{ URL::asset('assets/javascripts/plugins/retina/retina.js') }}" type="text/javascript"></script>
    <script src="{{ URL::asset('assets/javascripts/plugins/jgrowl/jquery.jgrowl.min.js') }}" type="text/javascript"></script>

    <script src="{{ URL::asset('assets/plugins/bootstrap-inputmask.min.js') }}" type="text/javascript"></script>
    <!--script src="/assets/plugins/city-area.js') }}" type="text/javascript"></script-->
    <script src="{{ URL::asset('assets/javascripts/plugins/bootbox/bootbox.min.js') }}" type="text/javascript"></script>
    <script src="{{ URL::asset('assets/plugins/fullcalendar-2.2.7-yearview/lib/moment.min.js') }}"></script>
    <script src="{{ URL::asset('assets/plugins/fullcalendar-2.2.7-yearview/fullcalendar.min.js') }}"></script>
    <script src="{{ URL::asset('assets/plugins/bootstrap-tagsinput/dist/bootstrap-tagsinput.min.js') }}"></script>
    <script src="{{ URL::asset('assets/plugins/eonasdan-bootstrap-datetimepicker-4.17.37/js/bootstrap-datetimepicker.min.js') }}" type="text/javascript"></script>
    <script src="{{ URL::asset('assets/javascripts/theme.js') }}" type="text/javascript"></script>
{{--     <script src="{{ URL::asset('assets/scripts/jquery-plugins-flatty.js') }}"></script> --}}
    {{-- <script src="{{ URL::asset('assets/scripts/jquery.cookie.js') }}"></script> --}}    
    <script src="{{ URL::asset('assets/plugins/select2.full.min.js') }}"></script>
    <script src="{{ URL::asset('assets/plugins/stupidtable.min.js') }}"></script>
    <script src="{{ URL::asset('assets/javascripts/jquery.table2excel.min.js') }}"></script>    
    <script src="{{ URL::asset('assets/javascripts/jquery.orgchart.min.js') }}"></script>
    <script src="{{ URL::asset('assets/javascripts/jquery.validate.js') }}"></script>
    <script src="{{ URL::asset('assets/javascripts/messages_zh_TW.min.js') }}"></script>