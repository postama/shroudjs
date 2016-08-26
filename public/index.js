'use strict';
nacl_factory.instantiate(nacl => {
  let receiver_key = nacl.from_hex(SERVER_KEY);
  let nonce = nacl.crypto_box_random_nonce();
  let jsonToSend = {
    'task':'test',
  };
  let message = nacl.encode_utf8(JSON.stringify(jsonToSend));
  let keypair = nacl.crypto_box_keypair();
  let cipherMsg = nacl.crypto_box(message, nonce, receiver_key, keypair.boxSk);
  let hexMsg = nacl.to_hex(cipherMsg);
  let clientKey = nacl.to_hex(keypair.boxPk);
  let noncehex = nacl.to_hex(nonce);


  let requestObject = {
    message: hexMsg,
    serverKey: SERVER_KEY,
    clientKey: clientKey,
    nonce: noncehex
  };

  let data = JSON.stringify(requestObject);

  let xhr = new XMLHttpRequest();
  var url = "/api";
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function(){
    if(xhr.readyState == 4 && xhr.status ==200){
      let response = JSON.parse(xhr.responseText);
      let responseText = nacl.from_hex(response.message);
      let nonce = nacl.from_hex(response.nonce);
      let msg = nacl.crypto_box_open(responseText, nonce, receiver_key, keypair.boxSk);
      console.log(nacl.decode_utf8(msg));
    }
  };

  xhr.send(data);
});
