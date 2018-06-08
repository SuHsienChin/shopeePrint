/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */


CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:

	// config.uiColor = '#ffffcd';
	
    //config.filebrowserBrowseUrl = '/product/browse?pure=1&123';
    //config.filebrowserImageBrowseUrl = '/product/browse?pure=1&123&Type=Images';
    //config.filebrowserFlashBrowseUrl = '/product/browse?pure=1&123&Type=Flash';
    
    config.filebrowserBrowseUrl      = '/assets/javascripts/plugins/ckfinder/ckfinder.html';
    config.filebrowserImageBrowseUrl = '/assets/javascripts/plugins/ckfinder/ckfinder.html?Type=Images';
    config.filebrowserFlashBrowseUrl = '/assets/javascripts/plugins/ckfinder/ckfinder.html?Type=Flash';
    
    config.filebrowserUploadUrl      = '/assets/javascripts/plugins/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Files'; //可上傳一般檔案
    config.filebrowserImageUploadUrl = '/assets/javascripts/plugins/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Images';//可上傳圖檔
    config.filebrowserFlashUploadUrl = '/assets/javascripts/plugins/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Flash';//可上傳Flash檔案

	config.language = 'zh-tw';

	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
};



