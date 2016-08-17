'use strict';
nacl_factory.instantiate(nacl => {
  let receiver_key = nacl.from_hex(SERVER_KEY);
  let nonce = nacl.crypto_box_random_nonce();
  let message = nacl.encode_utf8('from clienta d f asd fas df asd f asd f ds asd f asd f d a f ds f asd f asd');
  let keypair = nacl.crypto_box_keypair();



  let cipherMsg = nacl.crypto_box(message, nonce, receiver_key, keypair.boxSk);

  console.log(cipherMsg);
  console.log(nonce);
  console.log(receiver_key);
  console.log(keypair.boxSk);
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
      console.log(xhr.responseText);
    }
  };

  xhr.send(data);
});
