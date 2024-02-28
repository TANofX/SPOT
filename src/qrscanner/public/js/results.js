async function onScanSuccess(qrCodeMessage) {
    const data = await decodeQRCodeUrl(qrCodeMessage);
    document.getElementById('result').innerHTML = '<p>' + data + '</p>';
    // document.getElementById('result').innerHTML = '<p>' + qrCodeMessage + '</p>';
}

function onScanError(errorMessage) {

}

var html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", { fps: 30, qrbox: 250 });
html5QrcodeScanner.render(onScanSuccess, onScanError);

function decodeData(encodedData) {
    const decodedData = new Uint8ClampedArray(Array.from(atob(encodedData), (char) => {
        return char.charCodeAt(0);
    }));

    return decodedData;
}

async function decodeQRCodeUrl(image_url) {
    /*
    let img = new Image();
    let canvas = document.createElement("canvas");
    await new Promise(r => img.onload=r, img.src=image_url);

    canvas.width = img.width;
    canvas.height = img.height;

    let ctx = canvas.getContext("2d");
    ctx.drawImage(img,0,0);
    let imageData = ctx.getImageData(0,0,img.width,img.height);
    
    let bytes = jsQR(imageData.data, imageData.width, imageData.height).binaryData;
    let bits = bytes.reduce((acc,x) => acc+x.toString(2).padStart(8,"0"),"")
    */
    const qrConfig = await fetch("/config/qr.json").then(res => res.json());
    const ACTION_SCHEMA = qrConfig.ACTION_SCHEMA;

   let bytes = decodeData(image_url);
   let bits = bytes.reduce((acc, x) => acc+x.toString(2).padStart(8, "0"), "");
    console.log("hex bytes", bytes.map(x=>x.toString(16)))

    //parse bits
    let matchInfo = bits.slice(0,80);
    let actionQueueBits = bits.slice(80);

    console.log(matchInfo)
    let teamMatchPerformance = {
        timestamp: Date.now(),
        clientVersion: `${parseInt(matchInfo.slice(0,8),2)}.${parseInt(matchInfo.slice(8,16),2)}`, //major.minor
        scouterId: "qrcode",
        eventNumber: parseInt(bits.slice(16,24),2),
        matchNumber: String(parseInt(bits.slice(24,32),2)),
        robotNumber: String(parseInt(bits.slice(32,48),2)),
        matchId_rand: parseInt(bits.slice(48,80),2).toString(32),
        actionQueue: []
    };
    teamMatchPerformance.matchId = `${teamMatchPerformance.eventNumber}-${teamMatchPerformance.matchNumber}-${teamMatchPerformance.robotNumber}-${teamMatchPerformance.matchId_rand}`;
    
    let actionSize = ACTION_SCHEMA.reduce((acc,x) => acc+x.bits, 0);
    
    let nextAction = actionQueueBits.slice(0,actionSize);
    actionQueueBits = actionQueueBits.slice(actionSize)
    
    while (nextAction.slice(0,8) != "11111111") {
        let action = {};

        for (let {key,bits} of ACTION_SCHEMA) {
            if (key == "id") {
                action[key] = ID_ENUM_REVERSE[parseInt(nextAction.slice(0,bits),2)];
            } else {
                action[key] = parseInt(nextAction.slice(0,bits),2);
                nextAction = nextAction.slice(bits);
            }

        }
        teamMatchPerformance.actionQueue.push(action);
        nextAction = actionQueueBits.slice(0,actionSize);
        actionQueueBits = actionQueueBits.slice(actionSize)
    }

    
    return teamMatchPerformance;     
}