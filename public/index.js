'use strict';
nacl_factory.instantiate(nacl => {
  let receiver_key = from64(SERVER_KEY);
  let nonce = nacl.crypto_box_random_nonce();
  let jsonToSend = {
    'task':'test',
  };
  let message = nacl.encode_utf8(JSON.stringify(jsonToSend));
  let keypair = nacl.crypto_box_keypair();
  let cipherMsg = nacl.crypto_box(message, nonce, receiver_key, keypair.boxSk);

  let requestObject = {
    message: to64(cipherMsg),
    SPK: SERVER_KEY,
    clientKey: to64(keypair.boxPk),
    nonce: to64(nonce)
  };

  let data = JSON.stringify(requestObject);

  let xhr = new XMLHttpRequest();
  var url = "/api";
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function(){
    if(xhr.readyState == 4 && xhr.status ==200){
      let response = JSON.parse(xhr.responseText);
      let responseText = from64(response.message);
      let nonce = from64(response.nonce);
      let msg = nacl.crypto_box_open(responseText, nonce, receiver_key, keypair.boxSk);
      console.log(nacl.decode_utf8(msg));
    }
  };

  xhr.send(data);
});

function to64(bytes){
  return btoa(String.fromCharCode.apply(null, bytes))
}

function from64(base64String){
  return new Uint8Array(atob(base64String).split("").map(c => c.charCodeAt(0)));
}