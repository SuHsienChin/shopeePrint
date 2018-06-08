@extends('layouts.default')
@section('content')
<style type="text/css">
    .account-container {
        width: 40%;
        display: block;
        margin: 60px auto 0 auto;
        background: #f9f9f9;
        border: 1px solid #d5d5d5;
    }
</style>

<div class="account-container">
    <form class="form-horizontal" name="loginform" action="/shopeeGetUrl" method="post">
      {{ csrf_field() }}
        <div class="well-sm">
            <div class="row">
                <h2 class="form-signin-heading text-center"><span>萊爾富印單轉換</span></h2>
                <div class="col-md-12">
                    <div class="form-group controls">
                        <label class="control-label col-md-2 col-md-offset-2">連結</label>
                        <div class="col-md-7">
                            <input type="text" id="urlTxt" class="form-control" placeholder="連結" name="urlTxt" required="">
                        </div>
                    </div>
                </div>

                <div class="col-md-2 col-md-offset-5">
                    <button class="col-md-2 btn btn-primary btn-block" type="submit">送出</button>
                </div>
            </div>
        </div>
    </form>
</div>

 
@stop