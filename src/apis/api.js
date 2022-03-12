const moment = require("moment");
const db = require("../db");

const API_PATHS = {
	ADD_CLIENT: `${PATHS.API}/ADD_CLIENT`,
}
module.exports = {
	api: () => {
		app.post(API_PATHS.ADD_CLIENT, async (req, res) => {
			const  data   = req.body
				let dateB = [data.year,data.month,data.day]
				let unionD=dateB.join('-')
				let date = moment(unionD).format('YYYY-MM-DD');
				let dataSave={
					name:data.name,
					second_name:data.secondName ? data.secondName : null,
					lastname_1:data.lastName1,
					lastname_2:data.lastName2 ? data.lastName2 : null,
					birthday:date,
					email:data.email,
					phone:data.phone,
					created:moment().subtract(6,'hours').toDate()
				}
				let response = await db.insertAndGet({ model: db.t.users_test_roxana, data: dataSave })
				return res.json(createResponse({ data: { response }, reason: REASONS.Success }))
		})
	}
}
