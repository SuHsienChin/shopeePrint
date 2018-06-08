@extends('layouts.dashboard')
@section('content')
<div class="row" id="content-wrapper">
    <div class="col-xs-12">
    <!-- 標題 -->
    <div class="row">
        <div class="col-sm-12">
            <div class="page-header ">
                <div class="pull-left">
                    <ul class="breadcrumb" style="font-size:9pt;">
                         <li>
                            <a href="/person"><i class="icon-home"></i></a>
                          </li>
                          <a href="/person">人事薪資系統</a>
                    </ul>
                </div>
                <!-- Breadcrumbs End -->
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-sm-12">
            <div class="box bordered-box orange-border">
            <div class="box-content box-no-padding">
                <div class="well-sm">
                	<form class="form-horizontal" name="loginform" action="/reset/pwd" method="post">
				      {{ csrf_field() }}
				        <div class="well-sm">
				            <div class="row">
				                <h2 class="form-signin-heading text-center"><span>重設密碼</span></h2>
				                <div class="col-md-12">
				                    <div class="form-group controls">
				                        <label class="control-label col-md-2 col-md-offset-2">帳號</label> 
				                        <div class="col-md-4">
				                            <input type="text"  class="form-control" value="{{$account}}" name="account" readonly="">
				                        </div>
				                    </div>
				                </div>
				                <div class="col-md-12">
				                    <div class="form-group controls">
				                        <label class="control-label col-md-2 col-md-offset-2">舊密碼</label>
				                        <div class="col-md-4">
				                            <input type="password" name="password"  class="form-control" placeholder="密碼" required="">
				                        </div>
				                    </div>
				                </div>
				                <div class="col-md-12">
				                    <div class="form-group controls">
				                        <label class="control-label col-md-2 col-md-offset-2">新密碼</label>
				                        <div class="col-md-4">
				                            <input type="password" name="new_password"  class="form-control" placeholder="新密碼" required="">
				                        </div>
				                    </div>
				                </div>
				                <div class="col-md-12">
				                    <div class="form-group controls">
				                        <label class="control-label col-md-2 col-md-offset-2">確認新密碼</label>
				                        <div class="col-md-4">
				                            <input type="password" name="confirm_new_password"  class="form-control" placeholder="確認新密碼" required="">
				                        </div>
				                    </div>
				                </div>
				                @if ($alert = Session::get('alert-fail'))
				                <div class="col-md-6 col-md-offset-4">
				                    <h5><span>{{$alert}}</span></h5>
				                </div>
				                @endif
				                @if(Session::get('status'))
			                	<div class="col-md-6 col-md-offset-4">
				                    <h5><span>{{Session::get('status')}}</span></h5>
				                </div>
				                @endif
				                <div class="col-md-2 col-md-offset-5">
				                    <button class="col-md-2 btn btn-primary btn-block" type="submit">重設</button>
				                </div>
				            </div>
				        </div>
				    </form>
                </div>
            </div>    
            </div>              
        </div>
    </div>

    </div>   
</div>
@stop