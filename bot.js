var net = require('net');
var pack = require('bufferpack')
var fs = require('fs');
var rl = require('readline');

var users = [];


var game = new net.Socket();
var oda = new net.Socket();
var login = new net.Socket();

game.setKeepAlive(true, 0);
oda.setKeepAlive(true, 0);
login.setKeepAlive(true, 0);
var ownID = '5b06e6644f0c59d0944d2642';
var ownTOKEN = 'OQGFySrzWVZbOSssedU8OZABcwTrh7k50I4EBP9Y';
var roomID = '';
var gameServerIP = '34.244.118.250';
var gameServerPORT = 6789;


login.connect(6689, '34.202.114.192', function() {
	loginF(login);
});


login.on('data', function(data) {
	var res = loginPacketDecode(data);
	if (!res){
		console.log(data);
		return;
	}
	
	console.log(res);
	
	switch (res.m){
		case 0: //
			break;
		case 1: //arkadaş listesi
			//login.write(loginPacketEncode('{"a":0,"d":0,"m":2}'));
			//login.write(loginPacketEncode('{"m":37}'));		
			//		
			break;
		case 2: //server listesi			
			//login.write(loginPacketEncode('{"s":2,"m":45}'));
			break;
		case 44:
			
			break;
		case 45://friends online
			
			break;
		case 58://ban yedin
		
			break;
		case 106://klan listesi
			break;
			
		case 138://yeni oda
		
			break;
		case 140: //gelen arkadaş isteği
			console.log('oyun isteği From: ' + res.n);
			
			oda.connect(6788, res.a, function() {
				roomID = res.i;
				var sendData = new Buffer('0000003a080112360a18'+  strToHex(ownID) +'10021a18'+  strToHex(res.i),'hex');
				oda.write(sendData);
			});
			break;
	}
});

rl = rl.createInterface(process.stdin, process.stdout)
rl.on('line', function (cmd) {
	cmd = cmd.split(" ");
	console.log(cmd);	
	switch(cmd[0]){
		case 'a':
			login.write(loginPacketEncode('{"a":"5aeb767c4f0c8445c9a24ed9","b":"ec2-35-172-227-178.compute-1.amazonaws.com","c":"5b06e8b54f0c99ab084f13df","m":139}'));
		break;
		case 'f':
			findGame();
			break;
		case '1':
			game.write(new Buffer('0000001f08063a1510a2ca021a0f0d5ce6c243157c8eefc01d907c3941bd01df172942','hex'));
			break;
		case '2':
			game.write(new Buffer('0000002008073A16080110BF181A0F0D2564874115DA6A08C11D7AB4F040BD01F09B4740','hex'));
			break;
		case '3':
			game.write(new Buffer('00000026080e5a1c080110b4cd021a140df784ee43152d23edc01d5c90ce40259999d940bd01f7ca2a42','hex'));
			break;
	}
});

game.on('data', function(data) {
	gamePacketDecode(data, game);
});

oda.on('data', function(data) {
	odaPacketDecode(data, oda);
});

login.on('close', function() {
	console.log('Connection closed: LOGIN');
});

game.on('close', function(data) {
	console.log('Connection closed: GAME');
});

oda.on('close', function(data) {
	console.log('Connection closed: ODA');
});


function findGame(){
	
	game.connect(gameServerPORT, gameServerIP, function() {
		game.write(new Buffer('0000004a08011a460a18'+ strToHex(ownID) +'10003a28' + strToHex(ownTOKEN),'hex'));
	});
}

function loginF(login){	
	fs.open('cookie.bin', 'r', function(status, fd) {
		if (status) {
			console.log(status.message);
			return;
		}
		var buffer = Buffer.alloc(800);
		fs.read(fd, buffer, 0, 577, 0, function(err, num) {
			login.write(buffer);
		});
	});
}


function odaPacketDecode(buffer, odaC){
	var i = 0;
	var len =  pack.unpack('L',buffer, i)[0]
	i += 4;
	var CHECK =  pack.unpack('B',buffer, i++)[0] //8
	var packetID =  pack.unpack('B',buffer, i++)[0] //packetID
	console.log('ODA PacketID= ' + packetID, CHECK);
	
	switch(packetID){
		case 7: //game Join
			var s = odaURLParse(i, buffer);
			console.log(s);
			game.connect(gameServerPORT, s.url, function() {
				game.write(new Buffer('0000006808011a640a18'+ strToHex(ownID) +'10001a1c0a18'+ strToHex(roomID) +'10023a28' + strToHex(ownTOKEN) ,'hex'));
			});
			break;
		case 10: // sleep check
			odaC.write(new Buffer('000000200806321c0a18' + strToHex(ownID),'hex'));
		break;
	}
}


function odaURLParse(i, buffer){
	i += 3;
	var len = pack.unpack('B',buffer, i)[0];
	var packet =  {url: pack.unpack(len+'s',buffer, ++i)[0]}
	return packet;
}


function gamePacketDecode(buffer, gameC){
	var i = 0;
	var len =  pack.unpack('L',buffer, i)[0]
	i += 4;
	var CHECK =  pack.unpack('B',buffer, i++)[0] //8
	var packetID =  pack.unpack('B',buffer, i++)[0] //packetID
	console.log('GAME PacketID= ' + packetID, CHECK);
	
	switch(packetID){
		case 1://match play
			gameC.write(new Buffer('000000020802','hex'));
			break;
		case 2:
			//gameC.write(new Buffer('000000080802bd0177585d42','hex'));
			break;
		case 3://player informations
		users = [];
		//normalModeMapSelect(i, buffer);
		console.log(users);
			break;
		case 4: //map selection
			//gameC.write(new Buffer('0000000808042a0408031002','hex'));
			break;
		case 5:
			break;
		case 6:
			break;
		case 7:
			break;
		case 10:
			break;
		case 11:
			break;
		case 12:
			break;
		case 13:
			break;
		case 26://game end
			break;
	}
}

function normalModeMapSelect(i, buffer){
	if (pack.unpack('B',buffer, i+8)[0] == 18)
		i++;
	i += 8;
	
	/* first user */
	var len = pack.unpack('B',buffer, i)[0];
	users[0] = {id: pack.unpack(len+'s',buffer, ++i)[0]}
	i += len + 1;
	len = pack.unpack('B',buffer, i)[0];
	users[0].name = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
	len = pack.unpack('B',buffer, ++i)[0];
	i += 24 + len;
	len = pack.unpack('B',buffer, i)[0];
	users[0].clan = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
	if (pack.unpack('B',buffer, i+12)[0] == 96)
		i++;
	i += 9;//no idea
	if (users[0].clan)
		i += 9;
	
	if (pack.unpack('B',buffer, i)[0] == 122)
		i += 1;
	
	len = pack.unpack('B',buffer, i)[0];
	users[0].otherID = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
	if (pack.unpack('B',buffer, i+4)[0] == 136)
		i++;
	if (pack.unpack('B',buffer, i+11)[0] == 18)
		i++;
	i += 11;
	
	/* second user */
	len = pack.unpack('B',buffer, i)[0];
	users[1] = {id: pack.unpack(len+'s',buffer, ++i)[0]}
	i += len + 1;
	len = pack.unpack('B',buffer, i)[0];
	users[1].name = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
	len = pack.unpack('B',buffer, ++i)[0];
	i += 24 + len;
	len = pack.unpack('B',buffer, i)[0];
	users[1].clan = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
	if (pack.unpack('B',buffer, i+12)[0] == 96)
		i++;
	i += 9;//no idea
	if (users[1].clan)
		i += 9;
	
	if (pack.unpack('B',buffer, i)[0] == 122)
		i += 1;
	
	len = pack.unpack('B',buffer, i)[0];
	users[1].otherID = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
	if (pack.unpack('B',buffer, i+4)[0] == 136)
		i++;
	if (pack.unpack('B',buffer, i+11)[0] == 18)
		i++;
	i += 11;
	
	/* third user */
	len = pack.unpack('B',buffer, i)[0];
	users[2] = {id: pack.unpack(len+'s',buffer, ++i)[0]}
	i += len + 1;
	len = pack.unpack('B',buffer, i)[0];
	users[2].name = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
	len = pack.unpack('B',buffer, ++i)[0];
	i += 24 + len;
	len = pack.unpack('B',buffer, i)[0];
	users[2].clan = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
	if (pack.unpack('B',buffer, i+12)[0] == 96)
		i++;
	i += 9;//no idea
	
	if (users[2].clan)
		i += 9;
	
	if (pack.unpack('B',buffer, i)[0] == 122)
		i += 1;
	
	len = pack.unpack('B',buffer, i)[0];
	users[2].otherID = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
	if (pack.unpack('B',buffer, i+4)[0] == 136)
		i++;
	if (pack.unpack('B',buffer, i+11)[0] == 18)
		i++;
	i += 11;
	
	/* fourth user */
	len = pack.unpack('B',buffer, i)[0];
	users[3] = {id: pack.unpack(len+'s',buffer, ++i)[0]}
	i += len + 1;
	len = pack.unpack('B',buffer, i)[0];
	users[3].name = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
	len = pack.unpack('B',buffer, ++i)[0];
	i += 24 + len;
	len = pack.unpack('B',buffer, i)[0];
	users[3].clan = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
	if (pack.unpack('B',buffer, i+12)[0] == 96)
		i++;
	i += 9;//no idea
	if (users[3].clan)
		i += 9;
	
	if (pack.unpack('B',buffer, i)[0] == 122)
		i += 1;
	
	len = pack.unpack('B',buffer, i)[0];
	users[3].otherID = pack.unpack(len+'s',buffer, ++i)[0];
	i += len;
}

function loginPacketDecode(data){
	var len = pack.unpack('L', data,0);
	var data = pack.unpack(len+'s', data, 4);
	if (data && len){
		data = data[0].replace("\\r?\\n", '');
		return JSON.parse(data);
	}
}

function loginPacketEncode(data){
	var len = data.length;
	var res = pack.pack('L'+ len +'s',[len, data]);
	return res;
}

function strToHex(str){
	return Buffer.from(str, 'utf8').toString('hex');
}

function writeDATA(buffer){
	fs.writeFileSync('gelen/gamestartpacket5.bin', buffer);
}