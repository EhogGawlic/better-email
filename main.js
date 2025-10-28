const express = require('express')
const app = express()
const Imap = require('imap'),
    inspect = require('util').inspect
app.use(express.json())
app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/index.html')
})
app.get('/styles.css', (req,res)=>{
    res.sendFile(__dirname+'/styles.css')
})
app.post('/getemails', async (req,res)=>{
    const emails = [];
    const imap = new Imap({
        user: req.body.email,
        password: req.body.pass,//plz do not remember ts
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        // Add this option to bypass certificate validation
        tlsOptions: {
            rejectUnauthorized: false
        }
    })

    function openInbox(cb) {
        imap.openBox('INBOX', true, cb)
    }

    imap.once('ready', function() {
        openInbox(function(err, box) {
            if (err) throw err
            const f = imap.seq.fetch('1:20', {
                bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                struct: true
            })
            f.on('message', function(msg, seqno) {
                console.log('Message #%d', seqno)
                const prefix = '(#' + seqno + ') '
                let email = {
                    seqno: seqno,
                    headers: null,
                    body: null
                }
                
    msg.on('body', function(stream, info) {
        let buffer = '';
        stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8');
        });
        stream.once('end', function() {
            if (info.which !== 'TEXT') {
                email.headers = Imap.parseHeader(buffer);
            } else {
                email.body = buffer;
            }
        });
    });
                msg.once('end', function() {
                    emails.push(email);
                    console.log(prefix + 'Finished');
                });
            });
            f.once('error', function(err) {
                console.log('Fetch error: ' + err);
                res.status(500).json({ error: err.message });
            });
            f.once('end', function() {
                console.log('Done fetching all messages!');
                imap.end();
                res.json(emails);
                return
            });
        })
    })

    imap.once('error', function(err) {
    console.log(err)
    })

    imap.once('end', function() {
    console.log('Connection ended')
    })

imap.connect()

})
app.listen(3000, (err)=>{
    console.log(err)
})