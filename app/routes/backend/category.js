var express = require('express');
var router 	= express.Router();
const util = require('util');
var moment = require('moment');
const { GatewayTimeout } = require('http-errors');

const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const CategoryModel 	= require(__path_schemas + 'category');
const ItemsModel 	= require(__path_schemas + 'items');
const ValidateItems	= require(__path_validates + 'category');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');

const linkIndex		 = '/' + systemConfig.prefixAdmin + '/category/';
const pageTitleIndex = 'Category Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views_admin + 'pages/category/';

// List items
router.get('(/status/:status)?', async (req, res, next) => {
	let objWhere	 = {};
	let keyword		 = ParamsHelpers.getParam(req.query, 'keyword', '');
	let currentStatus= ParamsHelpers.getParam(req.params, 'status', 'all'); 
	let statusFilter = await UtilsHelpers.createFilterStatus(currentStatus, "groups");

	let pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 3,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};

	if(currentStatus !== 'all') objWhere.status = currentStatus;
	if(keyword !== '') objWhere.name = new RegExp(keyword, 'i');

	await CategoryModel.count(objWhere).then( (data) => {
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
	
	CategoryModel
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
				collections: "group"
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

	CategoryModel.updateOne({_id: id}, data, (err, result) => {
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
		await CategoryModel.findById(item, async (error, result) =>{
			if(result.status != currentStatus){
				changed++;
			}
		});
		await CategoryModel.updateOne({_id: item}, data, (error, result)=>{
			
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
			await CategoryModel.updateOne({_id: cids[item]}, {ordering: parseInt(orderings[item]), modified: modified }, (err, result) => {});
		}
	}else{ 
		await CategoryModel.updateOne({_id: cids}, {ordering: parseInt(orderings), modified: modified}, (err, result) => {});
	}

	req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
	res.redirect(linkIndex);
});

// Delete
router.get('/delete/:id', (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 	
	CategoryModel.deleteOne({_id: id}, (err, result) => {
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete', async (req, res, next) => {
	for(let item of req.body.cid){

		await CategoryModel.deleteOne({_id: item});

	}
	req.flash('success', util.format(notify.DELETE_MULTI_SUCCESS, req.body.cid.length), false);
	res.redirect(linkIndex);
});

// FORM
router.get(('/form(/:id)?'), (req, res, next) => {
	let id		= ParamsHelpers.getParam(req.params, 'id', '');
	let item	= {name: '', ordering: 0, status: 'novalue'};
	let errors   = null;
	if(id === '') { // ADD
		res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors, collections: "group"});
	}else { // EDIT
		CategoryModel.findById(id, (err, item) =>{
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors, collections: "group"});
		});	
	}
});

// SAVE = ADD EDIT
router.post('/save',  async (req, res, next) => {
	req.body = JSON.parse(JSON.stringify(req.body));
	ValidateItems.validator(req);
	let item = Object.assign(req.body);
	let errors = req.validationErrors();

	if(typeof item !== "undefined" && item.id !== "" ){	// edit
		if(errors) { 
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors, collections: "group"});
		}else {

			let items = ItemsModel.find({'category.id': item.id}).exec();

			for(let a of await items){

				await ItemsModel.updateOne({_id: a._id}, {'category.name': item.name})

			}

			await CategoryModel.updateOne({_id: item.id}, {
				ordering: parseInt(item.ordering),
				name: item.name,
				status: item.status,
				slug: item.slug,
				modified: {
					user_id: 0,
					username: "admin",
					time: Date.now()
				}
			}, (err, result) => {

			});

			req.flash('success', notify.EDIT_SUCCESS, false);
			res.redirect(linkIndex);

		}
	}else { // add
		if(errors) { 
			res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors, collections: "group"});
		}else {
			item.created = {
				user_id: 0,
				username: "admin",
				time: Date.now()
			}
			new CategoryModel(item).save().then(()=> {
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

router.get("/change-acp/:id/:current", async(req,res,next) => {

	if(req.params.current == "true"){
		await CategoryModel.updateOne({_id: req.params.id}, {group_acp: false});
	} else {
		await CategoryModel.updateOne({_id: req.params.id}, {group_acp: true});
	}

	res.redirect(linkIndex);

})

module.exports = router;
