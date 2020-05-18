const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const jwt = require("jsonwebtoken");
const router = express.Router();
const fs = require('fs');
const sharp = require('sharp');

const slugify = require('../../functions/index').slugify;
const roles = require('../../config/auth').roles;

const User = require('../../models/user');

const verifyToken = require('../../config/auth').verifyToken;
const superUser = require('../../config/permissions').superUser;

router.get('/routes', (req, res) => {
    const routes = router.stack
    .filter(r => r.route)
    .map(r => {
      return {
        method: Object.keys(r.route.methods)[0].toUpperCase(),
        path: req.baseUrl + r.route.path
      };
    });
    res.json(routes);
});

router.delete('/logout', verifyToken, (req, res) => {
    res.json(req.user);
});

router.get('/', verifyToken, async (req, res) => {
    const page = req.query.page != undefined ? req.query.page : 1;
    const limit = req.query.limit != undefined ? req.query.limit : 10;
    const query = req.query.query != undefined ? req.query.query : '';
    const sortBy = req.query.sort != undefined ? req.query.sort : 'createdAt';
    const order = req.query.order != undefined ? req.query.order : -1;
    
    const re = new RegExp(query, "gi");

    let users = await User.paginate(
        {
            fullName: re
        },
        {
            limit,
            sort: { [sortBy]: order },
            page,
            select: ['-password']
        }
    );
    res.json(users);
});

router.get('/:id', verifyToken, async (req, res) => {
    if (req.params.id != undefined) {
        let user = await User.findOne({ _id: req.params.id }).select('-password');
        res.json(user);
    } else {
        res.json({
            error: 'User not found'
        });
    }
});

router.put('/:id/change-role', verifyToken, superUser, async (req, res, next) => {
    try {
        const role = req.body.role;
        if (Object.values(roles).indexOf(role) > -1) {
            const updating = await User.updateOne({ _id: req.params.id }, { $set: { role } });
            const user = await User.findOne({ _id: req.params.id }).select('-password');
            if (updating.nModified == 1) {
                res.json(user);
            }
        } else {
            const error = new Error('Role not available');
            error.status = 406;
            next(error);
        }
    } catch (e) {
        next(e);
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    let data = req.body;
    let result = await User.updateOne({ _id: req.params.id }, { $set: data });
    res.json(result);
});

router.put('/:id/change-name', verifyToken, async (req, res) => {
    const { firstName, lastName } = req.body;
    const errors = [];
    
    if (!firstName) {
        errors.push({ firstName: 'Please provide user\'s first name.' });
    }

    if (!lastName) {
        errors.push({ lastName: 'Please provide user\'s last name.' });
    }

    const fullName = `${firstName} ${lastName}`;

    if (errors.length == 0) {
        let result = await User.updateOne({ _id: req.params.id }, { $set: { firstName, lastName, fullName } });
        res.json(result);
    } else {
        res.json({ errors });
    }
});

router.put('/settings/change-password', verifyToken, async (req, res) => {
    const { currentPassword, password, confirmation } = req.body;
    const user = req.user;
    const errors = [];
    
    if (!currentPassword) {
        errors.push({ currentPassword: 'Please provide current password.' });
    }

    if (!password) {
        errors.push({ password: 'Please provide a new password.' });
    }

    if (!confirmation) {
        errors.push({ password: 'Please confirm your password.' });
    }

    if (password < 6) {
        errors.push({ password: 'Password must be at least 6 characters.' });
    }

    if (password != confirmation) {
        errors.push({ confirmation: 'Your passwords do not match.' });
    }

    bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
        if (err) {
            console.log(err);
        }

        if (!isMatch) {
            errors.push({ confirmation: 'Your current password is incorrect.' });
        }

        if (errors.length == 0) {
            bcrypt.genSalt(10, (err, salt) => bcrypt.hash(password, salt, async (err, hash) => {
                if (err) {
                    console.log(err);
                }
                let result = await User.updateOne({ _id: user._id }, { $set: { password: hash } });
                res.json(result);
            }));
        } else {
            res.json({ errors });
        }
    });
});

router.delete('/:id', verifyToken, async (req, res) => {
    let user = await User.deleteOne({ _id: req.params.id });
    res.json({
        status: 'deleted',
        details: user
    });
});

router.get('/:id/image', async (req, res) => {
    const image = await User.findOne({ _id: req.params.id }).select(['image']);
    res.json(image);
});

router.post('/:id/image', verifyToken, async (req, res) => {
  
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const user = await User.findOne({ _id: req.params.id });

  let file = req.files.file;
  let fileName = req.files.file.name;
  let ext = path.extname(fileName);

  let dateTime = new Date(user.createdAt);

  const fileN = `${slugify(user.fullName+" "+dateTime.getTime().toString())}${ext}`;

  let finalFile = `/uploads/users/original/${fileN}`;

  let pathstr = __dirname;
  pathstr = pathstr.substr(0, pathstr.indexOf('/routes'));
  
  file.mv(`${path.join(pathstr, 'public')}${finalFile}`, async (err) => {
    if (err){
        res.send(err.message);
    } else {
      user.image.original = finalFile;
      await user.save();
      res.json({ status: 'picture uploaded' });
    }
  });
});

router.post('/:id/image/crop', async (req, res) => {
    sharp.cache(false);
    const { width, height, x, y, scaleX, scaleY } = req.body;
    const user = await User.findOne({ _id: req.params.id });

    let ext = '.jpeg';
    let dateTime = new Date(user.createdAt);
    const fileN = `${slugify(user.fullName+" "+dateTime.getTime().toString())}${ext}`;
    let finalFile = `/uploads/users/thumbnails/${fileN}`;

    let pathstr = __dirname;
    pathstr = pathstr.substr(0, pathstr.indexOf('/routes'));

    const image = sharp(`${path.join(pathstr, 'public')}${user.image.original}`);
        image
            .metadata()
            .then((metadata) => {
            return image
                    .extract({ left: parseInt(x, 10), top: parseInt(y, 10), width: parseInt(width, 10), height: parseInt(height, 10) })
                    .resize(300, 300)
                    .webp()
                    .toBuffer();
            })
            .then(data => {
                fs.writeFile(`${path.join(pathstr, 'public')}${finalFile}`, data, async (err) => {
                    if(err) {
                        return console.log(err);
                    }
                    user.image.thumbnail = finalFile;
                    await user.save();
                    res.send('OK');
                });
            }).catch(err => {
                console.log(err);
                res.json({err: 'An error occured'});
            });
});

router.post('/crop-picture/:id', verifyToken, async (req, res) => {
  
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const user = await User.findOne({ _id: req.params.id });
  let dateTime = new Date(user.createdAt);

  let file = req.files.file;
  let ext = '.jpeg';
  const fileN = `${slugify(user.fullName+" "+dateTime.getTime().toString())}${ext}`;
  let finalFile = `/uploads/users/thumbs/${fileN}`;

  let pathstr = __dirname;
  pathstr = pathstr.substr(0, pathstr.indexOf('/routes'));

  file.mv(`${path.join(pathstr, 'public')}${finalFile}`, async (err) => {
    if (err){
        res.send(err.message);
    } else {
      const image = sharp(`${path.join(pathstr, 'public')}${finalFile}`);
      image
          .metadata()
          .then(function(metadata) {
          return image
          .resize({
              width: 300,
              height: 300,
              fit: sharp.fit.cover,
              position: sharp.strategy.entropy
              })
              .webp()
              .toBuffer();
          })
          .then(data => {
              fs.writeFile(`${path.join(pathstr, 'public')}${finalFile}`, data, async (err) => {
                  if(err) {
                      return console.log(err);
                  }
                  user.photoUrl = finalFile;
                  await user.save();
                  res.json({ status: 'picture cropped' });
              });
          }).catch(err => {
              console.log(err);
              res.json({err: err});
          });
      }
  });
});

module.exports = router;