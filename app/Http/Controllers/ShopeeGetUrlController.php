<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;

use Yangqi\Htmldom\Htmldom;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;


class ShopeeGetUrlController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
        return view('login');
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
        $imgAry = [];
        $txtAry = [];
        $sendCode = '';
        $sendPerson = '';
        $getPerson = '';

        $html = new Htmldom($request->urlTxt);
        foreach($html->find('img') as $element) {
            array_push($imgAry,'https://external2.shopee.tw/ext/hilife/live/' . $element->src);
            try{
                $txt = explode('id=',$element->src);
                $txt = explode('|',$txt[1]);
                array_push($txtAry,$txt[0]);
            }catch(\Exception $e){

            }
        }

        try{
            $sendPerson = explode('寄 件 人：<td>',$html);
            $sendPerson = explode('</td>',$sendPerson[1]);
            $sendPerson = $sendPerson[0];
        }catch(\Exception $e){

        }

        try{
            $sendCode = explode('寄件代碼：<td>',$html);
            $sendCode = explode('</td>',$sendCode[1]);
            $sendCode = $sendCode[0];
        }catch(\Exception $e){

        }

        try{
            $getPerson = explode('取 件 人：<td  style="font-size: 18px">',$html);
            $getPerson = explode('</td>',$getPerson[1]);
            $getPerson = $getPerson[0];
        }catch(\Exception $e){

        }

        return view('showPrint', compact('imgAry','txtAry','sendPerson','sendCode','getPerson'));

    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
}
