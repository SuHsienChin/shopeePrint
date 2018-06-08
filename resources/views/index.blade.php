@extends('layouts.default')
@section('content')
<style type="text/css">
    .jumbotron {
        background-color: #924e31;
    }

</style>

<div class="jumbotron">
  <div class="container text-center">
    <h2 style="color:white;font-family:'微軟正黑體';">人事薪資系統</h2>
  </div>
</div>


<div class="container" style="min-height: 300px;">
    <div class="row">
        @inject('CheckSeePersonPermission', 'App\Presenters\CheckSeePermissionPresenter')
        @if($CheckSeePersonPermission->check())
        <div class="col-sm-4">
            <div class="well-sm">
                <div class="box-quick-link bg-primary">
                    <a href="/person">
                        <div class="header">
                            <div class="icon-user"><span style="color:white;font-family:'微軟正黑體';">人事系統</span></div>
                        </div>
                    </a>
                </div>
            </div>    
        </div>
        @endif

        @inject('CheckSeeReiPermission', 'Modules\Reimburse\Persenters\CheckSeePermissionPresenter')
        @if($CheckSeeReiPermission->check())
        <div class="col-sm-4">
            <div class="well-sm">
                <div class="box-quick-link btn-success">
                    <a href="/reimburse">
                        <div class="header">
                            <div class="icon-briefcase"><span style="color:white;font-family:'微軟正黑體';">零用金/差旅系統</span></div>
                        </div>
                    </a>
                </div>
            </div>    
        </div>
        @endif

    </div>
</div>
@stop