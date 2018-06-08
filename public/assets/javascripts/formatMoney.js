/**
 * 金額按千分位格式化
 * @character_set UTF-8
 * @author Jerry.li(hzjerry@gmail.com)
 * @version 1.2014.08.24.2143
 *  Example
 *  <code>
 *      alert($.formatMoney(1234.345, 2)); //=>1,234.35
 *      alert($.formatMoney(-1234.345, 2)); //=>-1,234.35
 *      alert($.unformatMoney(1,234.345)); //=>1234.35
 *      alert($.unformatMoney(-1,234.345)); //=>-1234.35
 *  </code>
 */
;(function($)
{
    $.extend({
        /**
         * 數字千分位格式化
         * @public
         * @param mixed mVal 數值
         * @param int iAccuracy 小數位精度(預設2位)
         * @return string
         */
        formatMoney:function(mVal, iAccuracy){
            var fTmp = 0.00;//臨時變量
            var iFra = 0;//小數部份
            var iInt = 0;//整數部份
            var aBuf = new Array(); //輸出緩存
            var bPositive = true; //保存正負值標記(true:正數)
            /**
             * 輸出定長字符串，不夠補0
             * <li>閉包函數</li>
             * @param int iVal 值
             * @param int iLen 輸出的長度
             */
            function funZero(iVal, iLen){
                var sTmp = iVal.toString();
                var sBuf = new Array();
                for(var i=0,iLoop=iLen-sTmp.length; i<iLoop; i++)
                    sBuf.push('0');
                sBuf.push(sTmp);
                return sBuf.join('');
            };

            if (typeof(iAccuracy) === 'undefined')
                iAccuracy = 2;
            bPositive = (mVal >= 0);//取出正負號
            fTmp = (isNaN(fTmp = parseFloat(mVal))) ? 0 : Math.abs(fTmp);//強制轉換為絕對值浮數
            //所有內容用正規化處理
            iInt = parseInt(fTmp); //分離整數部份
            iFra = parseInt((fTmp - iInt) * Math.pow(10,iAccuracy) + 0.5); //分離小數部份(四括五入)

            do{
                aBuf.unshift(funZero(iInt % 1000, 3));
            }while((iInt = parseInt(iInt/1000)));
            aBuf[0] = parseInt(aBuf[0]).toString();//最高段區去掉前導0
            /*return ((bPositive)?'':'-') + aBuf.join(',') +'.'+ ((0 === iFra)?'00':funZero(iFra, iAccuracy));*/
            return ((bPositive)?'':'-') + aBuf.join(','); //拿掉小數點以後
        },
        /**
         * 將千份位格式的數字字串轉換為浮點數
         * @public
         * @param string sVal 數值字符串
         * @return float
         */
        unformatMoney:function(sVal){
            var fTmp = parseFloat(sVal.replace(/,/g, ''));
            return (isNaN(fTmp) ? 0 : fTmp);
        },
    });
})(jQuery);

