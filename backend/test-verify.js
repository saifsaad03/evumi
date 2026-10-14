async function run() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const email = `citizen.${rand}@gmail.com`;
  const nid = `8877665544${rand}`;

  const backendBase = process.env.BACKEND_URL || 'http://localhost:5000';
  console.log(`\n1. Sending OTP to ${email}...`);
  const sendRes = await fetch(`${backendBase}/api/otp/send-registration-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, nid, name: 'টেস্ট নাগরিক' })
  });
  const sendData = await sendRes.json();
  console.log('Send Response:', sendData);

  const otpToken = sendData.otpToken;
  const fs = require('fs');
  const otps = JSON.parse(fs.readFileSync('./data/otps.json', 'utf8'));
  const found = otps.find(o => o.email === email);
  const correctOtp = found.otp;
  console.log('Found OTP on disk/memory:', correctOtp);

  console.log('\n2. Testing WRONG OTP verification...');
  const wrongRes = await fetch('http://localhost:5000/api/otp/verify-and-register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'টেস্ট নাগরিক',
      father_name: 'পিতা',
      mother_name: 'মাতা',
      nid,
      division: 'রাজশাহী',
      district: 'বগুড়া',
      upazila: 'শিবগঞ্জ',
      phone: '01711223344',
      email,
      password: 'Password123#',
      otp: '999999',
      otpToken
    })
  });
  const wrongData = await wrongRes.json();
  console.log('Wrong OTP Response (status ' + wrongRes.status + '):', wrongData);

  console.log('\n3. Testing CORRECT OTP verification...');
  const correctRes = await fetch('http://localhost:5000/api/otp/verify-and-register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'টেস্ট নাগরিক',
      father_name: 'পিতা',
      mother_name: 'মাতা',
      nid,
      division: 'রাজশাহী',
      district: 'বগুড়া',
      upazila: 'শিবগঞ্জ',
      phone: '01711223344',
      email,
      password: 'Password123#',
      otp: correctOtp,
      otpToken
    })
  });
  const correctData = await correctRes.json();
  console.log('Correct OTP Response (status ' + correctRes.status + '):', correctData);

  console.log('\n4. Checking users saved on disk...');
  const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
  console.log('Users in backend/data/users.json:', users.map(u => ({ email: u.email, nid: u.nid })));

  console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
