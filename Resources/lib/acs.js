var globalVariables = require('globalVariables');
var Cloud = require('ti.cloud');
var alert = require('lib/alert');
var db = require('/db/db');

var loggedIn = false;
globalVariables.GV.sessionId = Ti.App.Properties.getString('sessionId',null);
globalVariables.GV.userId = Ti.App.Properties.getString('userId', null);

exports.loginUser = function(email, password, callback) {

	Cloud.Users.login({
		login : email,
		password : password
	}, function(e) {
		if (e.success) {
			var user = e.users[0];
			Ti.API.info("USER:   "+JSON.stringify(user));
			//Ti.API.error(Ti.App.Properties.setString.use);
			Ti.App.Properties.setString('lastname', user.last_name);
			globalVariables.GV.lastName = user.last_name;
			Ti.App.Properties.setString('firstname', user.first_name);
			globalVariables.GV.firstName = user.first_name;
			globalVariables.GV.repName = globalVariables.GV.firstName+' '+globalVariables.GV.lastName;
			Ti.App.Properties.setString('userId', user.id);
			globalVariables.GV.userId = user.id;
			Ti.App.Properties.setString('sessionId', Cloud.sessionId);
			globalVariables.GV.sessionId=Cloud.sessionId;//e.meta.session_id;
			Ti.App.Properties.setString('userRole', user.role);
			globalVariables.GV.userRole = user.role;
			Ti.API.info("SESSION ID IS:  " +Cloud.sessionId);
			globalVariables.GV.cloudSessionSet=true;
			// Ti.App.Properties.setBool("loggedIn",true);
			// globalVariables.GV.loggedIn=true;
			globalVariables.GV.proposalsViewFirstTime=true;
			globalVariables.GV.sm_id = user.custom_fields.sm_id;
			Ti.App.Properties.setString("sm_id", globalVariables.GV.sm_id);
			globalVariables.GV.tm_id = user.custom_fields.tm_id;
			Ti.App.Properties.setString("tm_id", globalVariables.GV.tm_id);
			if(globalVariables.GV.userRole=="Admin")
			{
				globalVariables.GV.acl_id = null;
			}
			else
			{
				globalVariables.GV.acl_id = user.custom_fields.acl_id;
			}
			Ti.App.Properties.setString("acl_id", globalVariables.GV.acl_id);
			
			if(user.custom_fields.neverLoggedIn)
			{
				
				var t = Titanium.UI.create2DMatrix();
				t = t.scale(0);
	
				var w = Titanium.UI.createWindow({
					backgroundColor:'transparent',
					backgroundImage: "/images/iconGradientBG.png",
					borderWidth:1,
					borderColor:'#999',
					height:230,
					width:330,
					borderRadius:10,
					opacity:0.92,
					transform:t,
					layout: "vertical"
				});
	
				// create first transform to go beyond normal size
				var t1 = Titanium.UI.create2DMatrix();
				t1 = t1.scale(1.1);
				var a = Titanium.UI.createAnimation();
				a.transform = t1;
				a.duration = 200;
	
				// when this animation completes, scale to normal size
				a.addEventListener('complete', function()
				{
					Titanium.API.info('here in complete');
					var t2 = Titanium.UI.create2DMatrix();
					t2 = t2.scale(1.0);
					w.animate({transform:t2, duration:200});
			
				});
	
				// create a button to close window
				var tfNewPwd = Titanium.UI.createTextField({
					hintText: "New Password",
					height:30,
					width:"80%",
					top: 50,
					backgroundColor: "#fff",
					passwordMask: true
				});
				
				w.add(tfNewPwd);
				
				var tfNewPwdConf = Titanium.UI.createTextField({
					hintText: "Confirm Password",
					height:30,
					width:"80%",
					top: 20,
					backgroundColor: "#fff",
					passwordMask: true
				});
				
				w.add(tfNewPwdConf);
				
				var changeBtn = Ti.UI.createButton({
					title: "Change Password",
					height: 30,
					top: 20,
					color: "#0082b4",
					font:{
						fontSize: 25
					}
				});
				
				w.add(changeBtn);
				
				changeBtn.addEventListener('click', function()
				{
					var t3 = Titanium.UI.create2DMatrix();
					t3 = t3.scale(0);
					w.close({transform:t3,duration:300});
					if(tfNewPwd.value == tfNewPwdConf.value){
						changePwd({
							pwd: tfNewPwd.value
						}, function(f){
							if(f.success){
								aclsmUpdate({
								    user: user
								    }, function(f){
								        callback(f);
								});
							}
							else{
								alert.alert("Could not change password. You will be asked next time you log in. \n"+JSON.stringify(f));
								callback(f);
							}
						});
					}
					else{
						alert("Passwords don't match. Try again.");
						tfNewPwd.value="";
						tfNewPwdConf.value="";
					}
				});
			
				w.open(a);
			}
			else{
			    //call acsmUpdateFn
			    aclsmUpdate({
                    user: user
                    }, function(f){
                        callback(f);
                });
			}
		}
		else{
            callback(e);
        }
    });

};
		
function aclsmUpdate(params, callback){		
    var user = params.user;
    var aclFixed=null;
	var smtmFixed=null;
				
	if(user.custom_fields.aclBugFixed==false||user.custom_fields.aclBugFixed==null)
	{
	    db.insertAclBugFix(function(f){
	        
	        if(!f.success){
	            //alert(f.message+"\n Permissions were not patched due to error in Database. Please logout and login in again.");
	            callback({
                    success: false,
                    message: f.message+"\n Permissions were not patched due to error in Database. Please logout and login in again."
                });
	        }
	        else{
	            aclFixed=true;
	            Cloud.Users.update({
                    custom_fields:{
                        aclBugFixed: true
                    }
                }, function(g){
                    if(g.success)
                    {
                        if(user.custom_fields.smtmBugFixed==false||user.custom_fields.smtmBugFixed==null)
                        {
                            db.insertSmTmBugFix(function(h){
                                if(!h.success){
                                    alert(h.message+"\n Sales Manager Permissions were not patched due to error in Database. Please logout and login in again.");
                                }
                                else{
                                    smtmFixed=true;
                                    //if(user.custom_fields.smtmBugFixed==null)
                                    Cloud.Users.update({
                                        custom_fields:{
                                            smtmBugFixed: true
                                        }
                                    }, function(j){
                                        if(j.success)
                                        {
                                            
                            		          aclFixed=null;
                            				  smtmFixed=null;
                            				  callback({
                            				      success: true
                            				  });
                            				
                            			}
                            			else{
                            			    //alert(j.message+"\n SMTM Patch confirmation was not applied in ACS. Please logout and login in again.");
                            			    callback({
                                                success: false,
                                                message: j.message+"\n SMTM Patch confirmation was not applied in ACS. Please logout and login in again."
                                            });
                            			}
                                    });
                                }
                            });
                        }
                    }
                    else{
                        callback({
                            success: false,
                            message: j.message+"\n ACL Patch confirmation was not applied in ACS. Please logout and login in again."
                        });
                        //alert(g.message+"\n ACL Patch confirmation was not applied in ACS. Please logout and login in again.");
                    }
                });
	        }
	    });
	}
	else if(user.custom_fields.smtmBugFixed==false||user.custom_fields.smtmBugFixed==null)
    {
        db.insertSmTmBugFix(function(f){
            if(!f.success){
                //alert(f.message+"\n Sales Manager Permissions were not patched due to error in Database. Please logout and login in again.");
                callback({
                    success: false,
                    message: j.message+"\n Sales Manager Permissions were not patched due to error in Database. Please logout and login in again.."
                });
            }
            else{
                smtmFixed=true;
                //if(user.custom_fields.smtmBugFixed==null)
                Cloud.Users.update({
                    custom_fields:{
                        smtmBugFixed: true
                    }
                }, function(g){
                    if(g.success)
                    { 
                        smtmFixed=null;
                        callback({
                            success: true
                        });
                    }
                    else{
                        //alert(g.message+"\n SMTM Patch confirmation was not applied in ACS. Please logout and login in again.");
                        callback({
                            success: false,
                            message: g.message+"\n SMTM Patch confirmation was not applied in ACS. Please logout and login in again."
                        });
                    }
                });
            }
        });
    }
    else{
        //no update needed.
        callback({
            success: true
        });
    }
	    
};
	
// else{
	// var aclFixed=null;
    // var smtmFixed=null;
//     
    // if(user.custom_fields.aclBugFixed==false||user.custom_fields.aclBugFixed==null)
    // {
        // db.insertAclBugFix(function(f){
//             
            // if(!f.success){
                // alert(f.message+"\n Permissions were not patched due to error in Database. Please logout and login in again.");
            // }
            // else{
                // aclFixed=true;
                // Cloud.Users.update({
                    // custom_fields:{
                        // aclBugFixed: true
                    // }
                // }, function(g){
                    // if(g.success)
                    // {
                        // if(user.custom_fields.smtmBugFixed==false||user.custom_fields.smtmBugFixed==null)
                        // {
                            // db.insertSmTmBugFix(function(h){
                                // if(!h.success){
                                    // alert(h.message+"\n Sales Manager Permissions were not patched due to error in Database. Please logout and login in again.");
                                // }
                                // else{
                                    // smtmFixed=true;
                                    // Cloud.Users.update({
                                        // custom_fields:{
                                            // smtmBugFixed: true
                                        // }
                                    // }, function(j){
                                        // if(j.success)
                                        // {
                                            // aclFixed=null;
                                            // smtmFixed=null;
                                            // callback({
                                                // success: true
                                            // });
                                        // }
                                        // else{
                                            // alert(j.message+"\n SMTM Patch confirmation was not applied in ACS. Please logout and login in again.");
                                        // }
                                    // });
                                // }
                            // });
                        // }
                        // else{
                            // callback(g);
                        // }
                    // }
                    // else{
                        // alert(g.message+"\n ACL Patch confirmation was not applied in ACS. Please logout and login in again.");
                    // }
                // });
            // }
        // });
    // }
    // else if(user.custom_fields.smtmBugFixed==false||user.custom_fields.smtmBugFixed==null)
    // {
        // db.insertSmTmBugFix(function(f){
            // if(!f.success){
                // alert(f.message+"\n Sales Manager Permissions were not patched due to error in Database. Please logout and login in again.");
            // }
            // else{
                // smtmFixed=true;
                // //if(user.custom_fields.smtmBugFixed==null)
                // Cloud.Users.update({
                    // custom_fields:{
                        // smtmBugFixed: true
                    // }
                // }, function(g){
                    // if(g.success)
                    // {
                        // callback({
                            // success: true
                        // });
                    // }
                    // else{
                        // alert(g.message+"\n SMTM Patch confirmation was not applied in ACS. Please logout and login in again.");
                        // }
                    // });
                // }
            // });
        // }
        // else{
            // callback(e);
        // }
  // }

		
		

function changePwd(params,callback){
	Cloud.Users.update({
		password: params.pwd,
		password_confirmation: params.pwd,
		custom_fields:{
			neverLoggedIn: false
		}
	}, function(e){
		callback(e);
	});
};

exports.logoutUser = function(callback){
	Cloud.Users.logout(function(e){
		if(e.success){
			Ti.App.Properties.setString('lastname', null);
			globalVariables.GV.lastName = null;
			Ti.App.Properties.setString('firstname', null);
			globalVariables.GV.firstName = null;
			Ti.App.Properties.setString('userId', null);
			globalVariables.GV.userId =null;
			Ti.App.Properties.setString('sessionId', null);
			globalVariables.GV.sessionId=null;
			Ti.App.Properties.setString('userRole', null);
			globalVariables.GV.userRole = null;
			Ti.App.Properties.setBool("loggedIn", false);
			globalVariables.GV.loggedIn = false;
			globalVariables.GV.cloudSessionSet = false;
			globalVariables.GV.sm_id = null;
			Ti.App.Properties.setString("sm_id", null);
			globalVariables.GV.tm_id = null;
			Ti.App.Properties.setString("tm_id", null);
			globalVariables.GV.acl_id = null;
			Ti.App.Properties.setString("acl_id", null);
			callback();
		}
		else{
			alert.alert('ERROR', e.message);
		}
	});
};

exports.queryProposalsByUid = function(params, callback) {
	
	//Ti.API.info(key+": "+value);
	Cloud.Objects.query({
		classname : 'Proposal',
		//page : 1,
		//per_page : 10,
		limit: 1000,
		where:{
			user_id: globalVariables.GV.userId
		}
	}, function(e) {
		Ti.API.debug("queryProposal by UID Results: " + JSON.stringify(e));
		if (e.success) {
			if(params.getUpdates){
				db.getAllLastDates(function(f){
					var changedArray = [];
					var moment=require("/lib/moment");
					for(var i=0;i<f.results.length;i++){
						var j=0;
						var found=false;
						while(!found && j<e.Proposal.length){
							if(e.Proposal[j].id==f.results[i].ProposalId){
								var remoteDate = moment(e.Proposal[j].updated_at);  ///CHANGE THIS BACK TO LASTUPDATED
								var localDate = moment(f.results[i].LastUpdated);
								if(remoteDate>localDate)
								{
									changedArray.push(e.Proposal[j]);
								}
								found=true;
							}
							j++;
						}
					}
					moment=null;
					callback({
						success: true,
						results: changedArray
					});
				});
			}
			else{
				callback({
					success: true,
					results:e.Proposal
				});
			}
		} else {
			callback({
				success: false,
				results: e
			});
			// alert.alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
	});
};

exports.queryProposalsBySmid = function(params,callback) {
	//var key=params.key.valueOf();
	//var value=params.value;
	//Ti.API.info(key+": "+value);
	Cloud.Objects.query({
		classname : 'Proposal',
		//page : 1,
		//per_page : 10,
		limit: 1000,
		where:{
			sm_id: globalVariables.GV.userId
		}
	}, function(e) {
		Ti.API.debug("queryProposal by sm_ID Results: " + JSON.stringify(e));
		if (e.success) {
			if(params.getUpdates){
				db.getAllLastDates(function(f){
					var changedArray = [];
					var moment=require("/lib/moment");
					for(var i=0;i<f.results.length;i++){
						var j=0;
						var found=false;
						while(!found && j<e.Proposal.length){
							if(e.Proposal[j].id==f.results[i].ProposalId){
								var remoteDate = moment(e.Proposal[j].updated_at);  ///CHANGE THIS BACK TO LASTUPDATED
                                var localDate = moment(f.results[i].LastUpdated);
								if(remoteDate>localDate)
								{
									changedArray.push(e.Proposal[j]);
								}
								found=true;
							}
							j++;
						}
					}
					callback({
						success: true,
						results: changedArray
					});
				});
			}
			else{
				callback({
					success: true,
					results:e.Proposal
				});
			}
		} else {
			callback({
				success: false,
				results: e
			});
			// alert.alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
	});
};

exports.queryProposalsByTmid = function(params, callback) {
	//var key=params.key.valueOf();
	//var value=params.value;
	//Ti.API.info(key+": "+value);
	Cloud.Objects.query({
		classname : 'Proposal',
		//page : 1,
		//per_page : 10,
		limit: 1000,
		where:{
			tm_id: globalVariables.GV.userId
		}
	}, function(e) {
		Ti.API.debug("queryProposal by tm_ID Results: " + JSON.stringify(e));
		if (e.success) {
			if(params.getUpdates){
				db.getAllLastDates(function(f){
					var changedArray = [];
					var moment=require("/lib/moment");
					for(var i=0;i<f.results.length;i++){
						var j=0;
						var found=false;
						while(!found && j<e.Proposal.length){
							if(e.Proposal[j].id==f.results[i].ProposalId){
								var remoteDate = moment(e.Proposal[j].updated_at);  ///CHANGE THIS BACK TO LASTUPDATED
                                var localDate = moment(f.results[i].LastUpdated);
								if(remoteDate>localDate)
								{
									changedArray.push(e.Proposal[j]);
									found=true;
								}
							}
							j++;
						}
					}
					callback({
						success: true,
						results: changedArray
					});
				});
			}
			else{
				callback({
					success: true,
					results:e.Proposal
				});
			}
		} else {
			callback({
				success: false,
				results: e
			});
			// alert.alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
	});
};

exports.getPartners = function(callback){
	Cloud.Objects.query({
		classname: 'ReferralPartner'
	}, function(e){
		if(e.success){
			callback({
				success: true,
				results: e.ReferralPartner
			});
		}
		else{
			callback({
				success: false,
				results: e
			});
		}
	});
};

exports.queryAllProposals = function(params,callback) {
	//var key=params.key.valueOf();
	//var value=params.value;
	//Ti.API.info(key+": "+value);
	Cloud.Objects.query({
		classname : 'Proposal',
		//page : 1,
		//per_page : 10,
		// where:{
			// user_id: value
		// }
		limit: 1000
	}, function(e) {
		if (e.success) {
			if(params.getUpdates){
				db.getAllLastDates(function(f){
					var changedArray = [];
					var moment=require("/lib/moment");
					for(var i=0;i<f.results.length;i++){
						var j=0;
						var found=false;
						while(!found && j<e.Proposal.length){
							if(e.Proposal[j].id==f.results[i].ProposalId){
								var remoteDate = moment(e.Proposal[j].updated_at);
                                var localDate = moment(f.results[i].LastUpdated);
								if(remoteDate>localDate)
								{
									changedArray.push(e.Proposal[j]);
								}
								found=true;
							}
							j++;
						}
					}
					
					callback({
						success: true,
						results: changedArray
					});
				});
			}
			else{
				callback({
					success: true,
					results:e.Proposal
				});
			}
		} else {
			callback({
				success: false,
				results: e
			});
			//alert.alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
	});
};

exports.downloadRemoteProposals = function(params, callback){
	var conditions=null;
	if(globalVariables.GV.userRole=="Admin"){
		Cloud.Objects.query({
			classname : 'Proposal',
			limit: 1000,
			where: {
				id: {"$nin":params.localProposals}
			}
		}, function(e){
				Ti.API.debug("queryProposal Results: " + JSON.stringify(e));
				if (e.success) {
					Ti.API.info("downloadRemoteProposals Results: " + JSON.stringify(e));
					//alert.alert('Success:\n' + 'Count: ' + e.Proposal[0].BusinessName);
					callback({
						success: e.success,
						results:e.Proposal
					});
				} else {
					callback({
						success: false,
						results: e
					});
					//alert.alert('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
				}
		});
	}
	else if(globalVariables.GV.userRole == "Sales Manager"){
		Cloud.Objects.query({
			classname : 'Proposal',
			limit: 1000,
			where: {
				sm_id: globalVariables.GV.userId,
				id: {"$nin":params.localProposals}
			}
		}, function(e){
			Ti.API.debug("queryProposal Results: " + JSON.stringify(e));
			if (e.success) {
				Ti.API.info("downloadRemoteProposals Results: " + JSON.stringify(e));
				//alert.alert('Success:\n' + 'Count: ' + e.Proposal[0].BusinessName);
				callback({
					success: e.success,
					results:e.Proposal
				});
			} else {
				callback({
					success: false,
					results: e
			    });
			}
		});
	}
	else if (globalVariables.GV.userRole == "Territory Manager"){
		Cloud.Objects.query({
			classname : 'Proposal',
			limit: 1000,
			where: {
				tm_id: globalVariables.GV.userId,
				id: {"$nin":params.localProposals}
			}
		}, function(e){
			Ti.API.debug("queryProposal Results: " + JSON.stringify(e));
			if (e.success) {
				Ti.API.info("downloadRemoteProposals Results: " + JSON.stringify(e));
				//alert.alert('Success:\n' + 'Count: ' + e.Proposal[0].BusinessName);
				callback({
					success: e.success,
					results:e.Proposal
				});
			} else {
				callback({
					success: false,
					results: e
			    });
			}
		});
	}
	else{
		Cloud.Objects.query({
		classname : 'Proposal',
		limit: 1000,
		where: {
			user_id: globalVariables.GV.userId,
			id: {"$nin":params.localProposals}
		}
		}, function(e){
			Ti.API.debug("queryProposal Results: " + JSON.stringify(e));
			if (e.success) {
				Ti.API.info("downloadRemoteProposals Results: " + JSON.stringify(e));
				//alert.alert('Success:\n' + 'Count: ' + e.Proposal[0].BusinessName);
				callback({
					success: e.success,
					results:e.Proposal
				});
			} else {
				callback({
						success: false,
						results: e
				});
			}
		});
	}	
};

exports.getDeletedIds = function(params, callback){
    Cloud.Objects.query({
        classname : 'Proposal',
        limit: 1000,
        where: {
            id: {"$in":params.localProposals}
        }
        },function(e){
            if(e.success){
                //Ti.API.info(JSON.stringify(e));
                var propIds = [];
                for(var i=0;i<e.Proposal.length;i++)
                {
                    propIds.push(e.Proposal[i].id);
                }
                callback({
                    success: propIds,
                    results:e.Proposal
                }); 
            }else {
                callback({
                        success: false,
                        results: e
                });
            }
    });
};

exports.createProposal = function(params,callback) {	
	var smid="";
	var tmid="";
	if(globalVariables.GV.userRole=="Sales Manager"){
		smid=globalVariables.GV.userId;
	}
	else if(globalVariables.GV.userRole=="Territory Manager")
	{
		tmid=globalVariables.GV.userId;
		smid=globalVariables.GV.sm_id;
	}
	else if(globalVariables.GV.userRole=="Account Executive"){
		tmid=globalVariables.GV.tm_id;
		smid=globalVariables.GV.sm_id;
	}
	
	if(params)
	{
		var row = params.row;
		Cloud.Objects.create({
			//session_id: globalVariables.GV.sessionId,
			classname : 'Proposal',
			acl_id: row.acl_id,
			fields : {
				BusinessName : row.BusinessName,
				StreetAddress : row.StreetAddress,
				State : row.State,
				City : row.City,
				Zip : row.Zip,
				Contact : row.Contact,
				Phone : row.Phone,
				BusinessType: row.BusinessType,
				ProcessingMonths : row.ProcessingMonths,
				debitVol : parseFloat(row.debitVol).toFixed(2),
                aeVol : parseFloat(row.aeVol).toFixed(2),
                dsVol : parseFloat(row.dsVol).toFixed(2),
                mcVol : parseFloat(row.mcVol).toFixed(2),
                visaVol : parseFloat(row.visaVol).toFixed(2),
				debitTransactions : row.debitTransactions,
				aeTransactions : row.aeTransactions,
				dsTransactions : row.dsTransactions,
				mcTransactions : row.mcTransactions,
				visaTransactions : row.visaTransactions,
				debitAverageTicket : parseFloat(row.debitAverageTicket).toFixed(2),
                aeAverageTicket : parseFloat(row.aeAverageTicket).toFixed(2),
                dsAverageTicket : parseFloat(row.dsAverageTicket).toFixed(2),
                mcAverageTicket : parseFloat(row.mcAverageTicket).toFixed(2),
                visaAverageTicket : parseFloat(row.visaAverageTicket).toFixed(2),
                TotalCurrentFees : parseFloat(row.TotalCurrentFees).toFixed(2),
                CurrentEffectiveRate : parseFloat(row.CurrentEffectiveRate).toFixed(2),
                debitInterchangeFees : parseFloat(row.debitInterchangeFees).toFixed(2),
                aeInterchangeFees : parseFloat(row.aeInterchangeFees).toFixed(2),
                dsInterchangeFees : parseFloat(row.dsInterchangeFees).toFixed(2),
                mcInterchangeFees : parseFloat(row.mcInterchangeFees).toFixed(2),
                visaInterchangeFees : parseFloat(row.visaInterchangeFees).toFixed(2),
                debitProcessingFees : parseFloat(row.debitProcessingFees).toFixed(2),
                aeProcessingFees : parseFloat(row.aeProcessingFees).toFixed(2),
                dsProcessingFees : parseFloat(row.dsProcessingFees).toFixed(2),
                mcProcessingFees : parseFloat(row.mcProcessingFees).toFixed(2),
                visaProcessingFees : parseFloat(row.visaProcessingFees).toFixed(2),
                debitCardFees : parseFloat(row.debitCardFees).toFixed(2),
                aeCardFees : parseFloat(row.aeCardFees).toFixed(2),
                dsCardFees : parseFloat(row.dsCardFees).toFixed(2),
                mcCardFees : parseFloat(row.mcCardFees).toFixed(2),
                visaCardFees : parseFloat(row.visaCardFees).toFixed(2),
                TotalNewFees : parseFloat(row.TotalNewFees).toFixed(2),
                NewEffectiveRate : parseFloat(row.NewEffectiveRate).toFixed(2),
                MonthlySavings : parseFloat(row.MonthlySavings).toFixed(2),
                Year1Savings : parseFloat(row.Year1Savings).toFixed(2),
                Year2Savings : parseFloat(row.Year2Savings).toFixed(2),
                Year3Savings : parseFloat(row.Year3Savings).toFixed(2),
                Year4Savings : parseFloat(row.Year4Savings).toFixed(2),
                ProcessingFee : parseFloat(row.ProcessingFee).toFixed(2),
                AuthFee : parseFloat(row.AuthFee).toFixed(2),
                PinDebitProcessingFee : parseFloat(row.PinDebitProcessingFee).toFixed(2),
                PinDebitAuthFee : parseFloat(row.PinDebitAuthFee).toFixed(2),
                MonthlyServiceFee : parseFloat(row.MonthlyServiceFee).toFixed(2),
                IndustryComplinceFee : parseFloat(row.IndustryComplinceFee).toFixed(2),
                TerminalFee : parseFloat(row.TerminalFee).toFixed(2),
                MXGatewayFee : parseFloat(row.MXGatewayFee).toFixed(2),
                DebitAccessFee : parseFloat(row.DebitAccessFee).toFixed(2),
				//timeId: row.timeId,
				Notes: row.NotesText,
				LastUpdated: row.LastUpdated,
				DateCreated: row.DateCreated,
				ProposalStatus: row.ProposalStatus,
				rpID: row.rpID,
				sm_id: smid,
				tm_id: tmid
			}

		}, function(e) {
			if (e.success) {
				//globalVariables.GV.ProposalId = e.Proposal.id;
				//alert.alert("Success", "Created Successfully");
				Ti.API.info("PROPOSAL CUSTOM OBJECT:  \n" + JSON.stringify(e));				
				callback({success: true, 
					proposalId: e.Proposal[0].id,
					//timeId: e.Proposal[0].timeId
				});
			} else {
				callback({success: false,
				          message: 'Error creating proposal: \n' + JSON.stringify(e)
				});
				//alert.alert('Error creating proposal: \n', JSON.stringify(e));
			}
		});
	}
	else{
		Cloud.Objects.create({
			//session_id: globalVariables.GV.sessionId,
			classname : 'Proposal',
			acl_id: globalVariables.GV.acl_id,
			fields : {
				BusinessName : globalVariables.GV.BusinessName,
				StreetAddress : globalVariables.GV.StreetAddress,
				State : globalVariables.GV.State,
				City : globalVariables.GV.City,
				Zip : globalVariables.GV.Zip,
				Contact : globalVariables.GV.Contact,
				Phone : globalVariables.GV.Phone,
				BusinessType: globalVariables.GV.BusinessType,
				ProcessingMonths : globalVariables.GV.ProcessingMonths,
				debitVol : parseFloat(globalVariables.GV.debitVol).toFixed(2),
                aeVol : parseFloat(globalVariables.GV.aeVol).toFixed(2),
                dsVol : parseFloat(globalVariables.GV.dsVol).toFixed(2),
                mcVol : parseFloat(globalVariables.GV.mcVol).toFixed(2),
                visaVol : parseFloat(globalVariables.GV.visaVol).toFixed(2),
				debitTransactions : globalVariables.GV.debitTransactions,
				aeTransactions : globalVariables.GV.aeTransactions,
				dsTransactions : globalVariables.GV.dsTransactions,
				mcTransactions : globalVariables.GV.mcTransactions,
				visaTransactions : globalVariables.GV.visaTransactions,
				debitAverageTicket : parseFloat(globalVariables.GV.debitAverageTicket).toFixed(2),
                aeAverageTicket : parseFloat(globalVariables.GV.aeAverageTicket).toFixed(2),
                dsAverageTicket : parseFloat(globalVariables.GV.dsAverageTicket).toFixed(2),
                mcAverageTicket : parseFloat(globalVariables.GV.mcAverageTicket).toFixed(2),
                visaAverageTicket : parseFloat(globalVariables.GV.visaAverageTicket).toFixed(2),
                TotalCurrentFees : parseFloat(globalVariables.GV.TotalCurrentFees).toFixed(2),
                CurrentEffectiveRate : parseFloat(globalVariables.GV.CurrentEffectiveRate).toFixed(2),
                debitInterchangeFees : parseFloat(globalVariables.GV.debitInterchangeFees).toFixed(2),
                aeInterchangeFees : parseFloat(globalVariables.GV.aeInterchangeFees).toFixed(2),
                dsInterchangeFees : parseFloat(globalVariables.GV.dsInterchangeFees).toFixed(2),
                mcInterchangeFees : parseFloat(globalVariables.GV.mcInterchangeFees).toFixed(2),
                visaInterchangeFees : parseFloat(globalVariables.GV.visaInterchangeFees).toFixed(2),
                debitProcessingFees : parseFloat(globalVariables.GV.debitProcessingFees).toFixed(2),
                aeProcessingFees : parseFloat(globalVariables.GV.aeProcessingFees).toFixed(2),
                dsProcessingFees : parseFloat(globalVariables.GV.dsProcessingFees).toFixed(2),
                mcProcessingFees : parseFloat(globalVariables.GV.mcProcessingFees).toFixed(2),
                visaProcessingFees : parseFloat(globalVariables.GV.visaProcessingFees).toFixed(2),
                debitCardFees : parseFloat(globalVariables.GV.debitCardFees).toFixed(2),
                aeCardFees : parseFloat(globalVariables.GV.aeCardFees).toFixed(2),
                dsCardFees : parseFloat(globalVariables.GV.dsCardFees).toFixed(2),
                mcCardFees : parseFloat(globalVariables.GV.mcCardFees).toFixed(2),
                visaCardFees : parseFloat(globalVariables.GV.visaCardFees).toFixed(2),
                TotalNewFees : parseFloat(globalVariables.GV.TotalNewFees).toFixed(2),
                NewEffectiveRate : parseFloat(globalVariables.GV.NewEffectiveRate).toFixed(2),
                MonthlySavings : parseFloat(globalVariables.GV.MonthlySavings).toFixed(2),
                Year1Savings : parseFloat(globalVariables.GV.Year1Savings).toFixed(2),
                Year2Savings : parseFloat(globalVariables.GV.Year2Savings).toFixed(2),
                Year3Savings : parseFloat(globalVariables.GV.Year3Savings).toFixed(2),
                Year4Savings : parseFloat(globalVariables.GV.Year4Savings).toFixed(2),
                ProcessingFee : parseFloat(globalVariables.GV.ProcessingFee).toFixed(2),
                AuthFee : parseFloat(globalVariables.GV.AuthFee).toFixed(2),
                PinDebitProcessingFee : parseFloat(globalVariables.GV.PinDebitProcessingFee).toFixed(2),
                PinDebitAuthFee : parseFloat(globalVariables.GV.PinDebitAuthFee).toFixed(2),
                MonthlyServiceFee : parseFloat(globalVariables.GV.MonthlyServiceFee).toFixed(2),
                IndustryComplinceFee : parseFloat(globalVariables.GV.IndustryComplinceFee).toFixed(2),
                TerminalFee : parseFloat(globalVariables.GV.TerminalFee).toFixed(2),
                MXGatewayFee : parseFloat(globalVariables.GV.MXGatewayFee).toFixed(2),
                DebitAccessFee : parseFloat(globalVariables.GV.DebitAccessFee).toFixed(2),
				//timeId: globalVariables.GV.timeId,
				Notes: globalVariables.GV.NotesText,
				LastUpdated: globalVariables.GV.LastUpdated,
				DateCreated: globalVariables.GV.DateCreated,
				ProposalStatus: globalVariables.GV.ProposalStatus,
				rpID: globalVariables.GV.rpID,
				sm_id: smid,
				tm_id: tmid
			}

		}, function(e) {
			if (e.success) {
				globalVariables.GV.ProposalId = e.Proposal[0].id;
				alert.alert("Success", "Created Successfully");
				callback({success: true,
					proposalId: e.Proposal[0].id,
					//timeId: e.Proposal[0].timeId
				});
			} else {
				callback({success: false});
				alert.alert('Error: \n', JSON.stringify(e));
			}
		});
	}
};

exports.updateProposal = function (params,callback){
	if(params)
	{
	var row = params.row;
	Cloud.Objects.update({
			//session_id: globalVariables.GV.sessionId,
			classname : 'Proposal',
			id: row.ProposalId,
			acl_id: row.acl_id,
			fields : {
				BusinessName : row.BusinessName,
				StreetAddress : row.StreetAddress,
				State : row.State,
				City : row.City,
				Zip : row.Zip,
				Contact : row.Contact,
				Phone : row.Phone,
				BusinessType: row.BusinessType,
				ProcessingMonths : row.ProcessingMonths,
				debitVol : parseFloat(row.debitVol).toFixed(2),
				aeVol : parseFloat(row.aeVol).toFixed(2),
				dsVol : parseFloat(row.dsVol).toFixed(2),
				mcVol : parseFloat(row.mcVol).toFixed(2),
				visaVol : parseFloat(row.visaVol).toFixed(2),
				debitTransactions : row.debitTransactions,
				aeTransactions : row.aeTransactions,
				dsTransactions : row.dsTransactions,
				mcTransactions : row.mcTransactions,
				visaTransactions : row.visaTransactions,
				debitAverageTicket : parseFloat(row.debitAverageTicket).toFixed(2),
				aeAverageTicket : parseFloat(row.aeAverageTicket).toFixed(2),
				dsAverageTicket : parseFloat(row.dsAverageTicket).toFixed(2),
				mcAverageTicket : parseFloat(row.mcAverageTicket).toFixed(2),
				visaAverageTicket : parseFloat(row.visaAverageTicket).toFixed(2),
				TotalCurrentFees : parseFloat(row.TotalCurrentFees).toFixed(2),
				CurrentEffectiveRate : parseFloat(row.CurrentEffectiveRate).toFixed(2),
				debitInterchangeFees : parseFloat(row.debitInterchangeFees).toFixed(2),
				aeInterchangeFees : parseFloat(row.aeInterchangeFees).toFixed(2),
				dsInterchangeFees : parseFloat(row.dsInterchangeFees).toFixed(2),
				mcInterchangeFees : parseFloat(row.mcInterchangeFees).toFixed(2),
				visaInterchangeFees : parseFloat(row.visaInterchangeFees).toFixed(2),
				debitProcessingFees : parseFloat(row.debitProcessingFees).toFixed(2),
				aeProcessingFees : parseFloat(row.aeProcessingFees).toFixed(2),
				dsProcessingFees : parseFloat(row.dsProcessingFees).toFixed(2),
				mcProcessingFees : parseFloat(row.mcProcessingFees).toFixed(2),
				visaProcessingFees : parseFloat(row.visaProcessingFees).toFixed(2),
				debitCardFees : parseFloat(row.debitCardFees).toFixed(2),
				aeCardFees : parseFloat(row.aeCardFees).toFixed(2),
				dsCardFees : parseFloat(row.dsCardFees).toFixed(2),
				mcCardFees : parseFloat(row.mcCardFees).toFixed(2),
				visaCardFees : parseFloat(row.visaCardFees).toFixed(2),
				TotalNewFees : parseFloat(row.TotalNewFees).toFixed(2),
				NewEffectiveRate : parseFloat(row.NewEffectiveRate).toFixed(2),
				MonthlySavings : parseFloat(row.MonthlySavings).toFixed(2),
				Year1Savings : parseFloat(row.Year1Savings).toFixed(2),
				Year2Savings : parseFloat(row.Year2Savings).toFixed(2),
				Year3Savings : parseFloat(row.Year3Savings).toFixed(2),
				Year4Savings : parseFloat(row.Year4Savings).toFixed(2),
				ProcessingFee : parseFloat(row.ProcessingFee).toFixed(2),
				AuthFee : parseFloat(row.AuthFee).toFixed(2),
				PinDebitProcessingFee : parseFloat(row.PinDebitProcessingFee).toFixed(2),
				PinDebitAuthFee : parseFloat(row.PinDebitAuthFee).toFixed(2),
				MonthlyServiceFee : parseFloat(row.MonthlyServiceFee).toFixed(2),
				IndustryComplinceFee : parseFloat(row.IndustryComplinceFee).toFixed(2),
				TerminalFee : parseFloat(row.TerminalFee).toFixed(2),
				MXGatewayFee : parseFloat(row.MXGatewayFee).toFixed(2),
				DebitAccessFee : parseFloat(row.DebitAccessFee).toFixed(2),
				//timeId: row.timeId,
				Notes: row.NotesText,
				LastUpdated: row.LastUpdated,
				DateCreated: row.Date,
				ProposalStatus: row.ProposalStatus,
				rpID: row.rpID,
				sm_id: row.sm_id,
				tm_id: row.tm_id
			}
,
		}, function(e) {
			if (e.success) {
				globalVariables.GV.ProposalId = e.Proposal[0].id;
				//alert.alert("Success", "Updated Successfully");
				callback({success: true,
					proposalId: e.Proposal[0].id
					//timeId: e.Proposal[0].timeId
				});
			} else {
				callback({success: false});
				alert.alert('Error: \n', JSON.stringify(e));
			}
		});
		}
		else{
			Cloud.Objects.update({
			//session_id: globalVariables.GV.sessionId,
				classname : 'Proposal',
				id: globalVariables.GV.ProposalId,
				acl_id: globalVariables.GV.acl_id,
				fields : {
					BusinessName : globalVariables.GV.BusinessName,
					StreetAddress : globalVariables.GV.StreetAddress,
					State : globalVariables.GV.State,
					City : globalVariables.GV.City,
					Zip : globalVariables.GV.Zip,
					Contact : globalVariables.GV.Contact,
					Phone : globalVariables.GV.Phone,
					BusinessType: globalVariables.GV.BusinessType,
					ProcessingMonths : globalVariables.GV.ProcessingMonths,
					debitVol : parseFloat(globalVariables.GV.debitVol).toFixed(2),
					aeVol : parseFloat(globalVariables.GV.aeVol).toFixed(2),
					dsVol : parseFloat(globalVariables.GV.dsVol).toFixed(2),
					mcVol : parseFloat(globalVariables.GV.mcVol).toFixed(2),
					visaVol : parseFloat(globalVariables.GV.visaVol).toFixed(2),
					debitTransactions : globalVariables.GV.debitTransactions,
					aeTransactions : globalVariables.GV.aeTransactions,
					dsTransactions : globalVariables.GV.dsTransactions,
					mcTransactions : globalVariables.GV.mcTransactions,
					visaTransactions : globalVariables.GV.visaTransactions,
					debitAverageTicket : parseFloat(globalVariables.GV.debitAverageTicket).toFixed(2),
					aeAverageTicket : parseFloat(globalVariables.GV.aeAverageTicket).toFixed(2),
					dsAverageTicket : parseFloat(globalVariables.GV.dsAverageTicket).toFixed(2),
					mcAverageTicket : parseFloat(globalVariables.GV.mcAverageTicket).toFixed(2),
					visaAverageTicket : parseFloat(globalVariables.GV.visaAverageTicket).toFixed(2),
					TotalCurrentFees : parseFloat(globalVariables.GV.TotalCurrentFees).toFixed(2),
					CurrentEffectiveRate : parseFloat(globalVariables.GV.CurrentEffectiveRate).toFixed(2),
					debitInterchangeFees : parseFloat(globalVariables.GV.debitInterchangeFees).toFixed(2),
					aeInterchangeFees : parseFloat(globalVariables.GV.aeInterchangeFees).toFixed(2),
					dsInterchangeFees : parseFloat(globalVariables.GV.dsInterchangeFees).toFixed(2),
					mcInterchangeFees : parseFloat(globalVariables.GV.mcInterchangeFees).toFixed(2),
					visaInterchangeFees : parseFloat(globalVariables.GV.visaInterchangeFees).toFixed(2),
					debitProcessingFees : parseFloat(globalVariables.GV.debitProcessingFees).toFixed(2),
					aeProcessingFees : parseFloat(globalVariables.GV.aeProcessingFees).toFixed(2),
					dsProcessingFees : parseFloat(globalVariables.GV.dsProcessingFees).toFixed(2),
					mcProcessingFees : parseFloat(globalVariables.GV.mcProcessingFees).toFixed(2),
					visaProcessingFees : parseFloat(globalVariables.GV.visaProcessingFees).toFixed(2),
					debitCardFees : parseFloat(globalVariables.GV.debitCardFees).toFixed(2),
					aeCardFees : parseFloat(globalVariables.GV.aeCardFees).toFixed(2),
					dsCardFees : parseFloat(globalVariables.GV.dsCardFees).toFixed(2),
					mcCardFees : parseFloat(globalVariables.GV.mcCardFees).toFixed(2),
					visaCardFees : parseFloat(globalVariables.GV.visaCardFees).toFixed(2),
					TotalNewFees : parseFloat(globalVariables.GV.TotalNewFees).toFixed(2),
					NewEffectiveRate : parseFloat(globalVariables.GV.NewEffectiveRate).toFixed(2),
					MonthlySavings : parseFloat(globalVariables.GV.MonthlySavings).toFixed(2),
					Year1Savings : parseFloat(globalVariables.GV.Year1Savings).toFixed(2),
					Year2Savings : parseFloat(globalVariables.GV.Year2Savings).toFixed(2),
					Year3Savings : parseFloat(globalVariables.GV.Year3Savings).toFixed(2),
					Year4Savings : parseFloat(globalVariables.GV.Year4Savings).toFixed(2),
					ProcessingFee : parseFloat(globalVariables.GV.ProcessingFee).toFixed(2),
					AuthFee : parseFloat(globalVariables.GV.AuthFee).toFixed(2),
					PinDebitProcessingFee : parseFloat(globalVariables.GV.PinDebitProcessingFee).toFixed(2),
					PinDebitAuthFee : parseFloat(globalVariables.GV.PinDebitAuthFee).toFixed(2),
					MonthlyServiceFee : parseFloat(globalVariables.GV.MonthlyServiceFee).toFixed(2),
					IndustryComplinceFee : parseFloat(globalVariables.GV.IndustryComplinceFee).toFixed(2),
					TerminalFee : parseFloat(globalVariables.GV.TerminalFee).toFixed(2),
					MXGatewayFee : parseFloat(globalVariables.GV.MXGatewayFee).toFixed(2),
					DebitAccessFee : parseFloat(globalVariables.GV.DebitAccessFee).toFixed(2),
					//timeId: globalVariables.GV.timeId,
					Notes: globalVariables.GV.NotesText,
					LastUpdated: globalVariables.GV.LastUpdated,
					DateCreated: globalVariables.GV.DateCreated,
					ProposalStatus: globalVariables.GV.ProposalStatus,
					rpID: globalVariables.GV.rpID,
					sm_id: globalVariables.GV.sm_id,
					tm_id: globalVariables.GV.tm_id,
			}

		}, function(e) {
			if (e.success) {
				globalVariables.GV.ProposalId = e.Proposal[0].id;
				alert.alert("Success", "Updated Successfully");
				callback({success: true,
					proposalId: e.Proposal[0].id,
					//timeId: e.Proposal[0].timeId
				});
			} else {
				callback({success: false});
				alert.alert('Error: \n', JSON.stringify(e));
			}
		});
		}
};

exports.getFiles = function(callback) {
	Cloud.Files.query({
		page : 1,
		per_page : 20
	}, function(e) {
		callback(e);
		if (e.success) {

		} else {
			Ti.API.error('Error:\n' + ((e.error && e.message) || JSON.stringify(e)));
		}
	});

};

exports.isLoggedIn = function(callback) {
	if(globalVariables.GV.sessionId) {
    	Cloud.sessionId = globalVariables.GV.sessionId;
    	globalVariables.GV.cloudSessionSet=true;
    	//Ti.App.Properties.
        var me = Cloud.Users.showMe(function(e) {
        	if(e.success){
        		var user = e.users[0];
        		if(user.id===globalVariables.GV.userId)
        		{
        			//loggedIn = true;
        			callback({loggedIn: true});
        		}
        	}
            else
            {
            	callback({loggedIn: false});
            }
        });    
    } 
    else {
        callback({loggedIn: false});
    }
};

exports.getRates= function(callback){
	Cloud.Objects.query({
		classname: "businessType"
	}, function(e){
		if(e.success){
			callback({
				success: e.success,
				results: e.businessType
			});
		}
		else{
			callback({
				success: e.success,
				results: e.message
			});
		}
	});
};

// Array.prototype.equals = function (array, strict) {
    // if (!array)
        // return false;
// 
    // if (arguments.length == 1)
        // strict = true;
// 
    // if (this.length != array.length)
        // return false;
// 
    // for (var i = 0; i < this.length; i++) {
        // if (this[i] instanceof Array && array[i] instanceof Array) {
            // if (!this[i].equals(array[i], strict))
                // return false;
        // }
        // else if (strict && this[i] != array[i]) {
            // return false;
        // }
        // else if (!strict) {
            // return this.sort().equals(array.sort(), true);
        // }
    // }
    // return true;
// };
