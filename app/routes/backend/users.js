var express = require('express');
var router 	= express.Router();
const util = require('util');
var moment = require('moment');
const { group } = require('console');
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const fs = require("fs");

const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const UsersModel 	= require(__path_schemas + 'users');
const GroupsModel 	= require(__path_schemas + 'groups');
const filesModel = require(__path_schemas + "photosfiles");
const chunksModel = require(__path_schemas + "photoschunks");
const Validate	= require(__path_validates + 'users');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');
const database = require(__path_configs + "database");

const linkIndex		 = '/' + systemConfig.prefixAdmin + '/users/';
const pageTitleIndex = 'User Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views_admin + 'pages/users/';

function randomStringGenerator( length ){
	let a = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let string = '';
	for(let i = 0; i < length; i++){
		string += a.charAt(Math.floor(Math.random()*36));
	}
	return string;
}

/*var storage = new GridFsStorage({
	url: `mongodb+srv://${database.username}:${database.password}@billcluster-wakvv.gcp.mongodb.net/${database.database}?retryWrites=true&w=majority`,
	file: (req, file) => {
		const match = ["image/png", "image/jpeg"];
		let name = randomStringGenerator(15) + "." + file.originalname.split(".")[1];
	
		if (match.indexOf(file.mimetype) === -1) {
		  const filename = name;
		  return filename;
		}
	
		return {
		  bucketName: "photos",
		  filename: name
		};
	  }
});*/

var storage = multer.diskStorage({

	destination: function(req,res, cb){
		cb(null, 'public/uploads');
	},
	filename: function(req, file, cb){
		cb(null, randomStringGenerator(10) + "." + file.originalname.split('.')[1]);
	}

})

var upload = multer({storage});

// List items
router.get('(/status/:status)?', async (req, res, next) => {
	let objWhere	 = {};
	let keyword		 = ParamsHelpers.getParam(req.query, 'keyword', '');
	let currentStatus= ParamsHelpers.getParam(req.params, 'status', 'all'); 
	let statusFilter = await UtilsHelpers.createFilterStatus(currentStatus, "users");

	let pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 3,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};

	let groups = [];

	await GroupsModel.find({}, "_id name", (err, result) =>{

		groups = result;

	});

	let showGroup = req.session.showGroup;
	if(showGroup == undefined) showGroup = "allGroup";

	if(currentStatus !== 'all') objWhere["status"] = currentStatus;
	if(keyword !== '') objWhere["name"] = new RegExp(keyword, 'i');
	if(showGroup != "allGroup") objWhere["group.id"] = showGroup;


	await UsersModel.count(objWhere).then( (data) => {
		pagination.totalItems = data;
	});

	let sortField = req.session.sortField;
	let sortType = req.session.sortType;

	if(sortField == undefined){
		sortField = "created.time"
	}

	if(sortType == undefined){
		sortType = "desc"
	}

	let ordering = {}

	ordering[sortField] = sortType;

	if(sortField == "status"){
		if(sortType == "desc"){
			ordering[sortField] = "asc";
		} else {
			ordering[sortField] = "desc";
		}
	}
	
	UsersModel
		.find(objWhere)
		.sort(ordering)
		.skip((pagination.currentPage-1) * pagination.totalItemsPerPage)
		.limit(pagination.totalItemsPerPage)
		.then( async (items) => {
			let dateCreated = [];
			let dateModified = [];
			for(let time of items){
				dateCreated.push(moment(time.created.time).format("M/D/YYYY") + " " + moment(time.created.time).format("h:mm A"));
			}
			for(let time of items){
				if(time.modified.time == undefined){
					dateModified.push("");
				} else {
					dateModified.push(moment(time.modified.time).format("M/D/YYYY") + " " + moment(time.modified.time).format("h:mm A"));
				}
			}
			res.render(`${folderView}list`, { 
				pageTitle: pageTitleIndex,
				items,
				statusFilter,
				pagination,
				currentStatus,
				keyword,
				dateCreated,
				dateModified,
				sortType,
				sortField,
				groups,
				showGroup
			});
		});
});

// Change status
router.get('/change-status/:id/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 
	let status			= (currentStatus === "active") ? "inactive" : "active";
	let data = {
		status: status,
		modified: {
			user_id: 0,
			username: "admin",
			time: Date.now()
		}
	}

	UsersModel.updateOne({_id: id}, data, (err, result) => {
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Change status - Multi
router.post('/change-status/:status', async (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	let data = {
		status: currentStatus,
		modified: {
			user_id: 0,
			username: "admin",
			time: Date.now()
		}
	}
	let changed = 0;

	for(let item of req.body.cid){
		await UsersModel.findById(item, async (error, result) =>{
			if(result.status != currentStatus){
				changed++;
			}
		});
		await UsersModel.updateOne({_id: item}, data, (error, result)=>{
			
		});
	}
	req.flash('success', util.format(notify.CHANGE_STATUS_MULTI_SUCCESS, changed) , false);
	res.redirect(linkIndex);
});

// Change ordering - Multi
router.post('/change-ordering', async (req, res, next) => {
	let cids 		= req.body.cid;
	let orderings 	= req.body.ordering;
	
	let	modified = {
		user_id: 0,
		username: "admin",
		time: Date.now()
	}

	if(Array.isArray(cids)) {
		for(let item in cids){
			await UsersModel.updateOne({_id: cids[item]}, {ordering: parseInt(orderings[item]), modified: modified }, (err, result) => {});
		}
	}else{ 
		await UsersModel.updateOne({_id: cids}, {ordering: parseInt(orderings), modified: modified}, (err, result) => {});
	}

	req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
	res.redirect(linkIndex);
});

// Delete
router.get('/delete/:id', (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 	
	UsersModel.deleteOne({_id: id}, (err, result) => {
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete', async (req, res, next) => {
	for(let item of req.body.cid){

		await UsersModel.deleteOne({_id: item});

	}
	req.flash('success', util.format(notify.DELETE_MULTI_SUCCESS, req.body.cid.length), false);
	res.redirect(linkIndex);
});

// FORM
router.get(('/form(/:id)?'), async (req, res, next) => {
	let id		= ParamsHelpers.getParam(req.params, 'id', '');
	let item	= {name: '', status: 'novalue', group: { id: '0' }};
	let errors   = null;
	let getGroups = GroupsModel.find({}, "_id name").exec();

	let groups = await getGroups;
	

	if(id === '') { // ADD
		res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors, groups});
	}else { // EDIT
		UsersModel.findById(id, (err, item) =>{
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors, groups});
		});	
	}
});

// SAVE = ADD EDIT
router.post('/save', upload.single('avatar'), async (req, res, next) => {
	req.body = JSON.parse(JSON.stringify(req.body));
	Validate.validator(req);

	let item = Object.assign(req.body);
	let errors = req.validationErrors();
	let getGroups = GroupsModel.find({}, "_id name").exec();

	let groups = await getGroups;

	if(typeof item !== "undefined" && item.id !== "" ){	// edit
		if(errors) { 
			fs.unlink(req.file.path, (err) => {
				if (err) {
				  console.error(err)
				  return
				}
			  
				//file removed
			  })
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors, groups});
		}else {
			UsersModel.updateOne({_id: item.id}, {
				name: item.name,
				password: item.password,
				status: item.status,
				avatar: req.file.filename,
				group: {

					id: req.body.group.split("-",1).toString(),
					name: req.body.group.split("-")[1].toString()

				},
				modified: {
					user_id: 0,
					username: "admin",
					time: Date.now()
				}
			}, (err, result) => {
				req.flash('success', notify.EDIT_SUCCESS, false);
				res.redirect(linkIndex);
			});
		}
	}else { // add
		if(errors) { 
			fs.unlink(req.file.path, (err) => {
				if (err) {
				  console.error(err)
				  return
				}
			  
				//file removed
			  })
			res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors, groups});
		}else {
			item.created = {
				user_id: 0,
				username: "admin",
				time: Date.now()
			}
			item.group = {
				id: req.body.group.split("-",1).toString(),
				name: req.body.group.split("-")[1].toString()
			}
			item.avatar = req.file.filename;
			new UsersModel(item).save().then(()=> {
				req.flash('success', notify.ADD_SUCCESS, false);
				res.redirect(linkIndex);
			})
		}
	}
});

router.get("/sort/:sortField/:sortType", (req,res,next) => {
	let sortField = req.params.sortField;
	let sortType = req.params.sortType;

	req.session.sortField = sortField;
	req.session.sortType = sortType;
	
	if(sortType == "refresh"){
		delete req.session.sortField;
		delete req.session.sortType;
	}

	res.redirect(linkIndex);
});

router.get("/showGroup/:id", async (req,res,next) =>{

	if(req.params.id != "allGroup"){

		req.session.showGroup = req.params.id;

	} else {

		req.session.showGroup = "allGroup";

	}

	res.redirect(linkIndex);

});


//upload Avatar
router.get('/avatar', (req, res, next)=>{
	res.render(`${folderView}upload`, { pageTitle: "Upload An Avatar"});
});

router.post('/upload', (req, res, next)=>{
	
	
	upload.single('avatar')(req, res, function (err) {
		if (err) {
		  // This is a good practice when you want to handle your errors differently
	
		  return
		}
	  })
	res.redirect(linkIndex);

});

router.get('/get', async (req, res, next)=>{

	let chunks;

	let fileData = [];
	
	await filesModel.findOne({}).then(async (data)=>{
		
		let getchunks = chunksModel.find({'_doc.files_id': data._id}).sort({'_doc.n': 1}).exec();

		chunks = await getchunks;

	})

	for(let a of chunks){
		
		fileData.push(a._doc.data.toString('base64'));

	}

	let finalFile = 'data:' + 'image/png' + ';base64,' + fileData.join('');

	res.render(`${folderView}image`, {pageTitle: "GridFS Image", finalFile});

});

router.post('/deleteAvatar', async (req,res,next)=>{

	if(Array.isArray(req.body.cid)){

		for(let items of req.body.cid){
			
			await UsersModel.findOne({_id: items}).then((item)=>{

				fs.unlink("public/uploads/" + item.avatar, (err) => {
					if (err) throw err;
					console.log(item.avatar);
				});
	
			})
			
			await UsersModel.updateOne({_id: items}, {$unset: { avatar: "" }});
		}

	} else {


		await UsersModel.findOne({_id: req.body.cid}).then((item)=>{

			fs.unlink("public/uploads/" + item.avatar, (err) => {
				if (err) throw err;
				console.log(item.avatar);
			});

		})
		
		await UsersModel.updateOne({_id: req.body.cid}, {$unset: { avatar: "" }});

	}
	
	res.redirect(linkIndex);

})

module.exports = router;
