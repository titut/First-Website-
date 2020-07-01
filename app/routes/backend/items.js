var express = require('express');
var router 	= express.Router();
const util = require('util');
var moment = require('moment');

const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const ItemsModel 	= require(__path_schemas + 'items');
const ValidateItems	= require(__path_validates + 'items');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');
const mongoose = require('mongoose');

const linkIndex		 = '/' + systemConfig.prefixAdmin + '/items/';
const pageTitleIndex = 'Item Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views + 'pages/items/';

// List items
router.get('(/status/:status)?', async (req, res, next) => {
	let objWhere	 = {};
	let keyword		 = ParamsHelpers.getParam(req.query, 'keyword', '');
	let currentStatus= ParamsHelpers.getParam(req.params, 'status', 'all'); 
	let statusFilter = await UtilsHelpers.createFilterStatus(currentStatus, "items");

	let pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 3,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};

	if(currentStatus !== 'all') objWhere.status = currentStatus;
	if(keyword !== '') objWhere.name = new RegExp(keyword, 'i');

	await ItemsModel.count(objWhere).then( (data) => {
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
	
	ItemsModel
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
				collections: "items"
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

	ItemsModel.updateOne({_id: id}, data, (err, result) => {
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
		await ItemsModel.findById(item, async (error, result) =>{
			if(result.status != currentStatus){
				changed++;
			}
		});
		await ItemsModel.updateOne({_id: item}, data, (error, result)=>{
			
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
			await ItemsModel.updateOne({_id: cids[item]}, {ordering: parseInt(orderings[item]), modified: modified }, (err, result) => {});
		}
	}else{ 
		await ItemsModel.updateOne({_id: cids}, {ordering: parseInt(orderings), modified: modified}, (err, result) => {});
	}

	req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
	res.redirect(linkIndex);
});

// Delete
router.get('/delete/:id', (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 	
	ItemsModel.deleteOne({_id: id}, (err, result) => {
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete', async (req, res, next) => {
	for(let item of req.body.cid){

		await ItemsModel.deleteOne({_id: item});

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
		res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors, collections: "items"});
	}else { // EDIT
		ItemsModel.findById(id, (err, item) =>{
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors, collections: "items"});
		});	
	}
});

// SAVE = ADD EDIT
router.post('/save', (req, res, next) => {
	req.body = JSON.parse(JSON.stringify(req.body));
	ValidateItems.validator(req);

	let item = Object.assign(req.body);
	let errors = req.validationErrors();

	if(typeof item !== "undefined" && item.id !== "" ){	// edit
		if(errors) { 
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors});
		}else {
			ItemsModel.updateOne({_id: item.id}, {
				ordering: parseInt(item.ordering),
				name: item.name,
				status: item.status,
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
			res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors});
		}else {
			item.created = {
				user_id: 0,
				username: "admin",
				time: Date.now()
			}
			new ItemsModel(item).save().then(()=> {
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
