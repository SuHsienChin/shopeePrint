(function ($){
	$.MallDialog = function() {
		var self = this;

		self.init = function() {
			$('.content').after("<div class='dialog dialog-confirm' title=''><p></p><hr><div class='dialog-btn-group'><div class='btn btn-sm btn-pure-gray btn-radius dialog-cancel-btn'>取消</div><div class='btn btn-sm btn-black btn-radius dialog-enter-btn'>確定</div></div></div> ");
			$('.content').after("<div class='dialog dialog-alert' title=''><p></p><hr><div class='dialog-btn-group'><div class='btn btn-sm btn-black btn-radius dialog-enter-btn'>確定</div></div></div> ")
			$('.content').after("<div class='dialog dialog-info' title=''><p></p></div> ")
			
			self.alertElemt = $( ".dialog-alert" )
		    self.confirmElemt = $( ".dialog-confirm" )
		    self.infoElemt = $( ".dialog-info" )

			$( ".dialog-confirm" ).dialog({
				width: 400,
		      	autoOpen: false,
		      	modal: true,
		      	draggable: false
		    });

		    $( ".dialog-alert" ).dialog({
		      	width: 400,
		      	autoOpen: false,
		      	modal: true,
		      	draggable: false
		    });

		    $( ".dialog-info" ).dialog({
	            autoOpen: false,
	            minHeight: 28,
	            width: 280,
            	modal: false,
            	draggable: false,
           		open: function(event, ui) {
                	setTimeout(function() {
                		self.infoElemt.dialog('close');
                	}, 2000);
            	}
        	});

		   
		}

		self.dialogClose = function() {
			self.alertElemt.dialog("close");
			self.confirmElemt.dialog("close");
			self.infoElemt.dialog('close');
		}	

		self.info = function(title,content) {
			self.infoElemt.closest('.ui-dialog').find('.ui-dialog-title').html(title);
			self.infoElemt.find('p').html(content);
			self.infoElemt.dialog('open');
		}

		self.alert = function(title,content,enterCallBack) {
			self.alertElemt.closest('.ui-dialog').find('.ui-dialog-title').html(title);
			self.alertElemt.find('p').html(content);
			self.alertElemt.dialog('open');
			if(typeof enterCallBack === 'function') {
				self.alertElemt.find('.dialog-enter-btn').unbind('click');
				self.alertElemt.find('.dialog-enter-btn').on('click',enterCallBack);
			}else{
				self.alertElemt.find('.dialog-enter-btn').unbind('click');
				self.alertElemt.find('.dialog-enter-btn').on('click',function() {
					self.alertElemt.dialog('close')
				});	
			}
		}

		self.confirm = function(title,content,enterCallBack,cancelCallBack) {
			self.confirmElemt.closest('.ui-dialog').find('.ui-dialog-title').html(title);
			self.confirmElemt.find('p').html(content);
			self.confirmElemt.dialog('open');
			if(typeof enterCallBack === 'function') {
				
				self.confirmElemt.find('.dialog-enter-btn').off('click');
				self.confirmElemt.find('.dialog-enter-btn').on('click',enterCallBack);
			}else{
				self.confirmElemt.find('.dialog-enter-btn').off('click');	
				self.confirmElemt.find('.dialog-enter-btn').on('click',function() {
					self.confirmElemt.dialog('close')
				});	
			}

			if(typeof cancelCallBack === 'function') {
				self.confirmElemt.find('.dialog-cancel-btn').off('click');
				self.confirmElemt.find('.dialog-cancel-btn').on('click',cancelCallBack);
			}else{
				self.confirmElemt.find('.dialog-cancel-btn').off('click');	
				self.confirmElemt.find('.dialog-cancel-btn').on('click',function() {
					self.confirmElemt.dialog('close')
				});	
			}
		}

	   
	}

	$.PriceStr = function(num) {
		var str = num + '' ;
        var length = Math.floor(str.length/4);
       
        if(length > 0) {
            for(var i = 1 ; i<= length ; i++) {
                str = str.splice((-3*i)-(i-1),0,',');
            }
        }
        return str;
	}

	$.PriceInt = function(str) {
		var strArray = str.split(',');
        var num='';
        $.each(strArray,function(key,val) {
            num +=val;
        });

        return parseInt(num) ;
	}
})(jQuery);