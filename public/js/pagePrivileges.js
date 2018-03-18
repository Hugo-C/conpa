if(sessionStorage.pseudo){
  $.ajax({
    type: 'POST',
    url: '/checkConnection',
    data: { username: sessionStorage.pseudo },
    error: function(){
      alert("Request Failed");
    },
    success: function(response){
      console.log(response);
      if(!response.match("OK")){
        window.location = '/connection';
      }
    }
  });
}else{
  window.location = '/connection';
}