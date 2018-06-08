window.unload = function(){};

$(document).ready(function(){
    /* 一般賣場提報 */
    $("#prod-detail1").select2({
        tags: ["10.1 吋及以下", "11 吋", "12 吋", "13 吋", "14 吋", "15 吋", "16 吋", "17 吋", "17 吋以上", "其他"],
        tokenSeparators: [",", " "],
        placeholder: "選擇螢幕尺寸"
    });

    if ($('input[name="pic-upload-type"]').length) {
        var showHidePicUploadType = function(v) {
            if (v == 0) {
                $('.normal-upload').show();
                $('.custom-upload').hide();
            }
            else {
                $('.normal-upload').hide();
                $('.custom-upload').show();
            }
        }
        
        $('input[name="pic-upload-type"]').bind('change', function(e) {
            showHidePicUploadType(e.target.value)
        })
        
        showHidePicUploadType($('input[name="pic-upload-type"]:checked').val())
        
    }
    
    if ($('input[name="prod-chart-type"]').length) {
        
        var showHideProdChartType = function(v) {
            if (v == 0) {
                $('.hiiir-chart').show();
                $('.custom-chart').hide();
            }
            else if (v == 1) {
                $('.hiiir-chart').hide();
                $('.custom-chart').show();
            }
            else {
                $('.hiiir-chart').hide();
                $('.custom-chart').hide();
            }
        }
        
        $('input[name="prod-chart-type"]').bind('change', function(e) {
            showHideProdChartType(e.target.value)
        })
        
        showHideProdChartType($('input[name="prod-chart-type"]:checked').val())
        
    }
    

   
    // 新增商品組合 submit & comboInput
    // $('.make-comboList-btn').bind('click', function(){
        // var comboNo = $('#comboNo').val();
        // var selectedId = $('.group-prod-list option:selected').val();
        // var selectedName = $('.group-prod-list option:selected').text();
        // var table = '';
// 
        // //combo累加計數器
        // var comboCounter = $('#comboCounter').val();
        // comboCounter++;
        // $('#comboCounter').val(comboCounter);
// 
        // // <input> 手輸商品
        // if (comboNo.length > 0){
            // $.ajax({
                // url: '/product/comboInput',
                // type:'POST',
                // data: { comboNo : comboNo },
                // dataType: 'json',
                // success: function(comboJson){
                    // if (comboJson == null || comboJson == 'undefined')alert("系統查無手動輸入商品編號");
                    // table += "<tr id='"+comboJson["comboNo"]+"'>" +
                        // "<td >"+comboJson["comboName"]+"</td>" +
                        // "<td><a class='btn btn-sm'>設定內容、規格及可接單量</a></td>"+
                        // "<td><a class='btn btn-sm' onclick=\"makeComboListDel('"+comboJson["comboNo"]+"')\">移除</a></td>" +
                        // "</tr>" +
                        // "<input type='hidden' id='make-comboType-"+comboCounter+"' name='make-comboType-"+comboCounter+"' value='"+comboJson["comboType"]+"'>" +
                        // "<input type='hidden' id='make-comboId-"+comboCounter+"' name='make-comboId-"+comboCounter+"' value='"+comboJson["comboNo"]+"'>" +
                        // "<input type='hidden' id='make-comboName-"+comboCounter+"' name='make-comboName-"+comboCounter+"' value='"+comboJson["comboName"]+"'>";
                    // $('#make-comboList').append(table);
                // },
                // error: function(jqXHR, textStatus, errorThrown) {alert("error");}
            // });
        // // <select> 選擇商品
        // } else {
// 
            // var p_cate = $('.prod-group-cate option:selected').val();
            // table += "<tr id='"+selectedId+"'>" +
                // "<td>"+selectedName+"</td>" +
                // "<td><a class='btn btn-sm'>設定內容、規格及可接單量</a></td>"+
                // "<td><a class='btn btn-sm' onclick=\"makeComboListDel('"+selectedId+"')\">移除</a></td>" +
                // "</tr>"+
                // "<input type='hidden' id='make-comboType-"+comboCounter+"' name='make-comboType-"+comboCounter+"' value='"+p_cate+"'>" +
                // "<input type='hidden' id='make-comboId-"+comboCounter+"' name='make-comboId-"+comboCounter+"' value='"+selectedId+"'>" +
                // "<input type='hidden' id='make-comboName-"+comboCounter+"' name='make-comboName-"+comboCounter+"' value='"+selectedName+"'>";
            // $('#make-comboList').append(table);
        // }
    // });

    // 新增商品組合  comboSelected
    // if ($('.prod-group-type, .prod-group-cate').length) {
// 
        // var onProdGroupSelectorChange = function(e) {
// 
            // //radio, select, supplierId
            // var p_type = $('.prod-group-type:checked').val();
            // var p_cate = $('.prod-group-cate option:selected').val();
            // var supplierId = $('#supplierId').val();
// 
            // //alert('radio button value:' + p_type + ', selected option value:' + p_cate);
            // // ajax code放這邊
            // // ajax 取完資料後 $('.group-prod-list').empty(); 清空select的option
            // // 然後再把ajax取回來的option append 到 $('.group-prod-list') 裡
// 
            // $.ajax({
                // url: '/product/comboSelected',
                // type:'POST',
                // data: { p_type : p_type , supplierId : supplierId , p_cate : p_cate },
                // dataType: 'json',
                // success: function(comboJson){
                    // $('.group-prod-list').empty();
                    // var i;
                    // for (i = 0; i < comboJson.length; i++) {
                        // $('.group-prod-list').append("<option value='"+comboJson[i].comboNo+"'>"+comboJson[i].comboName+"</option>");
                    // }
                // }
            // });
        // }
// 
        // $('.prod-group-type, .prod-group-cate').bind('change', onProdGroupSelectorChange);
        // $(document).ready(onProdGroupSelectorChange())
    // }

    /* 商品編號提報 */
    if ($('input[name="prod-type"]').length) {
        
        var showHideAddonProd = function(v) {
            if (v == 0) {
                $('.addon-prod').show('normal');
            }
            else {
                $('.addon-prod').hide('normal');
            }
        }
        
        $('input[name="prod-type"]').bind('change', function(e) {
            showHideAddonProd(e.target.value)
        })
        
        showHideAddonProd($('input[name="prod-type"]:checked').val())
        
    }
    
    
    /* 分類管理頁 */
    
    if ($('.catalog-list').length) {
    
        var openChildren = function(e) {
            var target = $(e.target);
            var row = $(e.target).parent().parent().parent().parent();
            
            if (row.hasClass('cate-row-level-1')) {
                row.eq(0).find('.cate-row-level-2').show('normal');
            }
            else if (row.hasClass('cate-row-level-2')) {
                row.eq(0).find('.cate-row-level-3').show('normal');
            }
            else if (row.hasClass('cate-row-level-3')) {
                row.eq(0).find('.cate-row-level-4').show('normal');
            }
            $(e.target).parent().find('.icon-minus-sign').show();
            $(e.target).hide();
            
            e.preventDefault();
        }
        
        var closeChildren = function(e) {
            var target = $(e.target);
            var row = $(e.target).parent().parent().parent().parent();
            
            if (row.hasClass('cate-row-level-1')) {
                row.eq(0).find('.cate-row-level-2').hide('normal');
            }
            else if (row.hasClass('cate-row-level-2')) {
                row.eq(0).find('.cate-row-level-3').hide('normal');
            }
            else if (row.hasClass('cate-row-level-3')) {
                row.eq(0).find('.cate-row-level-4').hide('normal');
            }
            $(e.target).parent().find('.icon-plus-sign').show();
            $(e.target).hide();
            
            e.preventDefault();
        }
        
        var deleteItem = function(e) {
            var target = $(e.target);
            if (!target.parent().parent().hasClass('cate-item-level-4')) {
                var row = $(e.target).parent().parent().parent().parent();
                if (!confirm('你確定要刪除「' + row.find('.cate-item:eq(0) span').text() + '」嗎？\r\n\r\n※ 請注意：\r\n1. 該分類下方的子分類也會一併被刪除。\r\n2. 刪除後即無法復原此動作。')) {
                    return;
                }
            }
            else {
                var row = $(e.target).parent().parent();
                if (!confirm('你確定要刪除「' + row.find('span').text() + '」嗎？\r\n\r\n※ 請注意：刪除後即無法復原此動作。')) {
                    return;
                }
            }
            row.remove();
            
            e.preventDefault();
        }
        
        var editItem = function(e) {
            var onKeyPress = function(ke) {
                if(ke.which == 13) {
                    $(e.currentTarget).text($(ke.target).val());
                    $(ke.target).remove();
                    var val=$(ke.target).val();
                    alert(val);
                }
            }
            var editInput = $('<input class="form-control cateEditInput" value="' + $(e.currentTarget).text() + '">');
            editInput.bind('keypress', onKeyPress);
            $(e.currentTarget).append(editInput);
        }
        
        $('.cate-item').each(function(index, item){
            var html = jQuery(item).html();
            html += '<div class="cate-item-tool">'
            if (!jQuery(item).hasClass('cate-item-level-1') && !jQuery(item).hasClass('cate-item-level-2')) {
                html += '<i class="icon-remove-sign"></i></a>';
            }
            if (!jQuery(item).hasClass('cate-item-level-4')) {
                html += '<i class="icon-plus-sign"></i>';
                html += '<i class="icon-minus-sign"></i>';
            }
            html += '</div>';
            jQuery(item).html(html);
        })
        
        //$('.cate-item .icon-minus-sign, .cate-row-level-1 .row').hide();
        $('.cate-item span').bind('dblclick', editItem);
        $('.cate-item .icon-plus-sign').hide();
        
        $('.cate-item .icon-plus-sign').bind('click', openChildren);
        $('.cate-item .icon-minus-sign').bind('click', closeChildren);
        $('.cate-item .icon-remove-sign').bind('click', deleteItem);
    }
    
    
    /* 商品審核頁 */
    if($('.prod-verify').length) {
    
        var checkAllProds = function() {
            var headerCheckbox = $('.prod-verify th input[type=checkbox]');
            var allCheckbox = $('.prod-verify td input[type=checkbox]');
            allCheckbox.attr('checked', headerCheckbox.attr('checked') ? true : false);
        }
        $('.prod-verify th input[type=checkbox]').bind('click', checkAllProds)

    
        var changeSelectedIndexToPopup = function() {
            $('.confirm-prods-items').text($('.prod-verify td input[type=checkbox]:checked').length);
        }
        $('.prod-verify td input[type=checkbox]').bind('click', changeSelectedIndexToPopup);
        changeSelectedIndexToPopup();
    }

    if ($('.mirror-form').length) {

        var mirrorFormHtml = $('.mirror-form').clone();

        $(document).on('click', '.mirror-form .add-mirror-form-btn', function(e){
            $(e.target).remove();
            $('.mirror-form').eq(0).before(mirrorFormHtml.clone());
            var i;
            for(i = 1; i <= $('.mirror-form').length; i++){
                $("select").eq(i).attr("name","productCategoryId"+i);
            }
        })
        
    }

    $('input[name="salePrice"]').bind('change', function(e) {
        if (($('#cost').val() != null && $('#cost').val() != 'undefined' && $('#cost').val() != '')){
            var salePrice, costPrice, grossProfit , grossProfitMargin;
            salePrice = $('#salePrice').val();
            costPrice = $('#cost').val();
            grossProfit = salePrice - costPrice;
            grossProfitMargin = ((salePrice-costPrice)/salePrice)*100;
            $(".grossProfit").val(grossProfit);
            $(".grossProfitMargin").val(grossProfitMargin);
        }
    })

    $('input[name="cost"]').bind('change', function(e) {
        if (($('#salePrice').val() != null && $('#salePrice').val() != 'undefined' && $('#salePrice').val() != '')){
            var salePrice, costPrice, grossProfit , grossProfitMargin;
            salePrice = $('#salePrice').val();
            costPrice = $('#cost').val();
            grossProfit = salePrice - costPrice;
            grossProfitMargin = ((salePrice-costPrice)/salePrice)*100;
            $(".grossProfit").val(grossProfit);
            $(".grossProfitMargin").val(grossProfitMargin);
        }
    })
})