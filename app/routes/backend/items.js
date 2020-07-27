var express = require('express');
var router 	= express.Router();
const util = require('util');
var moment = require('moment');
var multer = require("multer");

function randomStringGenerator( length ){
	let a = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let string = '';
	for(let i = 0; i < length; i++){
		string += a.charAt(Math.floor(Math.random()*36));
	}
	return string;
}

var storage = multer.diskStorage({
	destination: function(req,res, cb){
		cb(null, 'public/uploads');
	},
	filename: function(req, file, cb){
		cb(null, randomStringGenerator(10) + "." + file.originalname.split('.')[1]);
	}
})

var upload = multer({ storage:storage });

const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const ItemsModel 	= require(__path_schemas + 'items');
const CategoryModel = require(__path_schemas + "category");
const ItemsModel1 	= require(__path_models + 'items');
const ValidateItems	= require(__path_validates + 'items');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');

const linkIndex		 = '/' + systemConfig.prefixAdmin + '/items/';
const pageTitleIndex = 'Item Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views_admin + 'pages/items/';


// ---------------------------------------------------------------------------



// List items
router.get('(/status/:status)?', async (req, res, next) => {
	let model = {};
	model.objWhere = {};
	model.keyword		 = ParamsHelpers.getParam(req.query, 'keyword', '');
	model.currentStatus= ParamsHelpers.getParam(req.params, 'status', 'all'); 
	let statusFilter = await UtilsHelpers.createFilterStatus(model.currentStatus, "items");

	model.pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 3,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};

	if(model.currentStatus !== 'all') model[objWhere].status = model.currentStatus;
	if(model.keyword !== '') model[objWhere].name = new RegExp(keyword, 'i');

	await ItemsModel1.countItems(model.objWhere).then( (data) => {
		model.pagination.totalItems = data;
	});

	let sortField = req.session.sortField;
	let sortType = req.session.sortType;

	if(sortField == undefined){
		sortField = "created.time"
	}

	if(sortType == undefined){
		sortType = "desc"
	}

	model.ordering = {}

	model.ordering[sortField] = sortType;

	if(sortField == "status"){
		if(sortType == "desc"){
			model.ordering[sortField] = "asc";
		} else {
			model.ordering[sortField] = "desc";
		}
	}
	
	ItemsModel1
		.listItems(model)
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
				pagination: model.pagination,
				currentStatus: model.currentStatus,
				keyword: model.keyword,
				dateCreated,
				dateModified,
				sortType,
				sortField,
				collections: "items"
			});
		});
});

// Change status
router.get('/change-status/:id/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 

	ItemsModel1.changeStatus(id, currentStatus).then((data) => {
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

	let changed = await ItemsModel1.changeStatus(req.body.cid, currentStatus, 2);

	req.flash('success', util.format(notify.CHANGE_STATUS_MULTI_SUCCESS, changed) , false);
	res.redirect(linkIndex);
});

// Change ordering - Multi
router.post('/change-ordering', async (req, res, next) => {
	let cids 		= req.body.cid;
	let orderings 	= req.body.ordering;

	ItemsModel1.ordering(cids, orderings);

	req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
	res.redirect(linkIndex);
});

// Delete
router.get('/delete/:id', (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 	

	ItemsModel1.delete(id).then(() =>{
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete', async (req, res, next) => {
	for(let item of req.body.cid){

		await ItemsModel.deleteOne({_id: item});

	}

	await ItemsModel1.delete(req.body.cid, "multi");

	req.flash('success', util.format(notify.DELETE_MULTI_SUCCESS, req.body.cid.length), false);
	res.redirect(linkIndex);
});

// FORM
router.get(('/form(/:id)?'), (req, res, next) => {
	let id		= ParamsHelpers.getParam(req.params, 'id', '');
	let item	= {name: '', ordering: 0, status: 'novalue', category: {id: "none"}};
	let errors   = null;
	CategoryModel.find({}, function(err, result){

		if(id === '') { // ADD
			res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors, collections: "items", cat: result});
		}else { // EDIT
			ItemsModel.findById(id, (err, item) =>{
				res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors, collections: "items", cat: result});
			});	
		}

	});
});

// SAVE = ADD EDIT
router.post('/save', upload.single("picture") ,(req, res, next) => {
	req.body = JSON.parse(JSON.stringify(req.body));
	ValidateItems.validator(req);

	let item = Object.assign(req.body);
	let id = item.id;
	delete item.id;
	let errors = req.validationErrors();
	console.log(item);

	if(typeof item !== "undefined" && id !== "" ){	// edit
		if(errors) { 
			CategoryModel.find({}, function(err, result){

				res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors, collections: "items", category:result});

			});
		}else {
			item.modified = {
				user_id: 0,
				username: "admin",
				time: Date.now()
			};
			item.category = {

				name: item.category.split("-")[0],
				id: item.category.split("-")[1]

			}
			item.picture = req.file.filename;
			ItemsModel1.save(item, id, "edit").then(() => {
				req.flash('success', notify.EDIT_SUCCESS, false);
				res.redirect(linkIndex);
			});
			
		}
	}else { // add
		if(errors) { 
			CategoryModel.find({}, function(err, result){

				res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors, collections: "items", cat: result});

			});
		}else {
			item.created = {
				user_id: 0,
				username: "admin",
				time: Date.now()
			}
			item.category = {

				name: item.category.split("-")[0],
				id: item.category.split("-")[1]

			}
			ItemsModel1.save(item).then(()=> {
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
})

module.exports = router;	