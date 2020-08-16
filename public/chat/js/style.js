$(document).ready(()=>{

    let titleTop = $('#header-logo-container').height()/2 -  $('#header-title').height()/2;
    let headerTop = $('.page-header').height()/2 - $('#header-logo-container').height()/2;
    $('#header-title').css('top', titleTop);
    $('#header-logo-container').css('top', headerTop);

    let chatHeaderHeight = $('#chatbox-header').height();
    let chatAvatarHeight = $('#chatbox-header-avatar').height();
    let chatNameHeight = $('#chatbox-header-name').height();
    let chatAvatarTop = chatHeaderHeight/2 - chatAvatarHeight/2;
    let chatNameTop = chatAvatarHeight - chatHeaderHeight/2 + chatNameHeight/2;
    $('#chatbox-header-avatar').css('top', chatAvatarTop);
    $('#chatbox-header-name').css('bottom', chatNameTop);

})