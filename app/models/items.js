const ItemsModel = require(__path_schemas + 'items');

module.exports = {

    countItems(model) {

        return ItemsModel.count(model.objWhere);

    },

    listItems(model) {

        return ItemsModel
            .find(model.objWhere)
		    .sort(model.ordering)
		    .skip((model.pagination.currentPage-1) * model.pagination.totalItemsPerPage)
		    .limit(model.pagination.totalItemsPerPage);

    },

    async changeStatus(id, currentStatus, options = 1) {

        let status = (currentStatus === "active") ? "inactive" : "active";
      
        let data = {
            status: status,
            modified: {
                user_id: 0,
                username: "admin",
                time: Date.now()
            }
        }

        if(options == 1){

            return ItemsModel.updateOne({_id: id}, data);

        } else {

            data.status = currentStatus;
            
            if(typeof id === "string"){

                let changed = 0;
                
                await ItemsModel.findById(id).then(async (result) => {
                    if(result.status != currentStatus){
                        await ItemsModel.updateOne({_id: id}, data);
                        changed = 1;
                    }
                }); 

                return changed;

            } else {

                let change = 0;

                console.log(id);

                for(let ids of id){

                    await ItemsModel.updateOne({_id: ids}, data);
                    change++;

                }

                return change;
                
            }

        }

    },

    async ordering(id, orderings){

        let	data = {
            ordering: null,
            modified: {
                user_id: 0,
                username: "admin",
                time: Date.now()
            },
        }

        if(Array.isArray(id)) {
            for(let item in id){
                data.ordering = orderings[item];
                await ItemsModel.updateOne({_id: id[item]}, data);
            }
        }else{ 
            data.ordering = orderings;
            await ItemsModel.updateOne({_id: id}, data);
        }

        return null;

    },

    delete(id, options = null){

        if(options == null){

            return ItemsModel.deleteOne({_id: id});

        } else {

            if(Array.isArray(id)){

                for(let cid of id){
                    ItemsModel.deleteOne({_id: cid});
                }

            } else {

                ItemsModel.deleteOne({_id: id});

            }

            return null;

        }

    },

    async save(item, id = "", option = "add"){

        if(option == "edit"){

            return await ItemsModel.updateOne({_id: id}, item);

        } else if (option == "add"){

            return await ItemsModel.create(item);

        }

    }

}