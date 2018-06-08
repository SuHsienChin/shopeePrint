@extends('layouts.dashboard')
@section('content')
<style type="text/css">
    .panel-heading h4 {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: normal;
    width: 75%;
    padding-top: 8px;
}
</style>
<div class="row" id="content-wrapper">
    <div class="col-xs-12">
    <!-- 標題 -->
    <div class="row">
        <div class="col-sm-12">
            <div class="page-header">
                <div class="well-lg">
                    <h1 class="text-center"><span>人事薪資系統</span></h1>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-sm-12">
            <div class="box bordered-box orange-border">
                <div class="box-content box-no-padding">
                    <div class="col-sm-4 col-sm-offset-5">
                        <h1>公告欄</h1>
                    </div>
                    <div class="row well-sm" style="min-height: 400px;">
                        <div class="col-sm-10 col-sm-offset-1">
                            <div class="panel-group" id="accordion">
                            @foreach($boards as $board)
                                <div class="panel  panel-info">
                                    <div class="panel-heading">
                                        <h4 class="panel-title pull-left">
                                            主題：
                                            <a data-toggle="collapse" data-parent="#accordion" href="#collapse{{$board->id}}">
                                                {{$board->title}}
                                            </a>
                                        </h4>
                                        <h5 class="pull-right" style="color: black;">
                                            發文者：
                                            {{$board->employee->name}}
                                            時間：
                                            {{$board->created_at}}
                                        </h5>
                                        <div class="clearfix"></div>
                                    </div>
                                    <div id="collapse{{$board->id}}" class="panel-collapse collapse">
                                        <div class="panel-body">
                                            {!!$board->content!!}
                                        </div>
                                        <div class="panel-body">
                                            @foreach($board->boardFile as $file) 
                                            <div class="col-md-4">
                                                <a class="btn btn-primary" href="/{{$file->path}}">{{$file->name}}</a>
                                            </div>
                                            @endforeach
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                            </div>
                        </div>
                        <div class="col-sm-10 col-sm-offset-1">
                            {!! $boards->links() !!}
                        </div>
                    </div>
                </div>
            </div>              
        </div>
    </div>

    </div>   
</div>
@stop