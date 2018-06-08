<html xmlns="'http://www.w3.org/1999/xhtml" xml:lang="zh-TW">
<head>

</head>
<body>
<div class="account-container">
    <table width="400">
        <tr><td align="left" valign="middle">蝦皮購物</td><td rowspan="2"><img src="https://external2.shopee.tw/ext/hilife/live/image/01.png" /></td></tr>
        <tr><td align="left">廠商代號：901</td></tr>
        <tr><td align="left">廠商名稱：蝦皮店到店</td></tr>
        <tr><td align="center"><img id="Image39" src="{{$imgAry[0]}}" width="30%" /><br />{{$txtAry[0]}}</td></tr>
        <tr><td align="center"><img id="Image39" src="{{$imgAry[1]}}" width="60%" /><br />{{$txtAry[1]}}</td></tr>
        <tr><td >門市注意事項 </td></tr>
        <tr><td align="left">1.刷讀門市繳費專用一、二段條碼並開立發票及收據給消費者。</td></tr>
        <tr><td align="left">2.完成代收後，概不退款。</td></tr>
        <tr><td align="left">3.如條碼無法正常刷讀，請用手輸條碼方式輸入。</td></tr>
        <tr><td align="left">4.請寄件人自行將本單據黏貼於包裹上並確認是否牢固。</td></tr>
        <tr><td align="left">5.包裹務必於當日交給文化物流司機回收。</td></tr>
        <tr><td>[蝦皮店到店]</td></tr>
        <tr><td>寄件人：{{$sendPerson}}</td></tr>
        <tr><td>寄件代碼：{{$sendCode}}</td></tr>
        <tr><td>取件人：{{$getPerson}}</td></tr>
        <tr><td align="center"><img id="Image39" src="{{$imgAry[3]}}" width="60%" /><br />{{$txtAry[2]}}<br />物流專用條碼</td></tr>

    </table>

</div>
</body>
<script src="{{ URL::asset('assets/javascripts/jquery.print.js') }}" type="text/javascript"></script>
<script type="application/javascript" language="javascript">

    $(document).ready(function () {

    });

</script>

</html>