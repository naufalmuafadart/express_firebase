require('dotenv').config();
const express=require('express');
const port = process.env.PORT || 3000;
const saltedMd5=require('salted-md5');
const path=require('path');
const multer=require('multer');
const upload=multer({storage: multer.memoryStorage()});
const admin = require("firebase-admin");
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");

const serviceAccount = require("./serviceAccountKey.json");
const e = require("express");
const app = express();
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebaseApp =initializeApp(firebaseConfig);

// app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// view engine setup
app.set('views', path.join(__dirname, 'static', 'views'));
app.set('view engine', 'ejs');

app.use('/public', express.static(path.join(__dirname, 'static', 'public')));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

app.locals.bucket = admin.storage().bucket()
let db=admin.firestore();

let a=db.collection('users')
app.post('/data',async (req,res)=>{
  let docRef=a.doc(req.body.user.name)
  await docRef.set({
    hobby: req.body.user.hobby,
    age: req.body.user.age,
  });
  res.send('done');
});

app.post('/upload',upload.single('file'),async(req,res)=>{
  // const storage = getStorage();
  const timestamp = new Date().getTime();
  const extension = path.extname(req.file.originalname);
  const name = saltedMd5(req.file.originalname, 'SUPER-S@LT!');
  const fileName = `${name}_${timestamp}_${extension}`;
  // const fileRef = ref(storage, fileName);

  try {
    const item = {
      original_name: req.file.originalname,
      extension,
      storedName: fileName,
    };
    await app.locals.bucket.file(fileName).createWriteStream().end(req.file.buffer);
    // item.download_url = await getDownloadURL(fileRef);
    res.send(item);
  } catch (e) {
    res.send(e.message);
  }

  // uploadBytes(fileRef, req.file.buffer)
  //   .then((snapshot) => console.log({ snapshot }))
  //   .catch((error) => console.log(error.message));
  // res.send({
  //   originalName: req.file.originalname,
  //   extension,
  //   storedName: fileName,
  // });
});

app.get('/download', async (req, res) => {
  const storage = getStorage(firebaseApp);

  try {
    const url = await getDownloadURL(ref(storage, 'd8c8b0279cdf0f78dc92d46b95393f40_1674872316863_.mp3'));
    res.send({ url });
  } catch (e) {
    res.send({
      message: 'File does not exist',
    });
  }
});

app.listen(port, (req,res)=>{
  console.info(`Running on ${port}`)
});
