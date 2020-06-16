import heartBeat from './heartbeat'

var dom = document.getElementById("test")

heartBeat(dom, {
	chart: {
		beatInterVal: 5000,
		textStyle: {
			font: '1.2rem "Microsoft YaHei"'
		}
	},
	yAxis: {
		title: 'yAxis',
		space: 105,
		step: 4
	},
	xAxis: {
		space: 20,
		step: 6
	}
}, () => {
	return Promise.resolve(Math.round(Math.random() * 100));
});