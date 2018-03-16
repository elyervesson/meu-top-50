const got = require('got')
const fs = require('fs-extra')


options = {
	json: true, 
	headers: {
		Authorization: "Bearer BQArKtXbdYLfyI4Qd4oevwNtUQx7od7kCFs1znJbVTDkbwX_j5V8AJ59mOp6lEJBJ128MSj2BEseHfJgeBs2Udb2_ZU6Weev2ugOc2Ne1PNTKCVuQPtuA9gDx5K7OVTV0xh1kNY9MsYtmJNR6DNtUVDjud0"
	}
}

got("https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50",  options)
	.then(data => { 
		nodes = data.body.items;

		mapa_ids = nodes.map(element => element.id)
		return Promise.all(
			data.body.items.map( e => got(`https://api.spotify.com/v1/artists/${e.id}/related-artists`, options))
		)
	}).then(related_artists => {
		related_artists = related_artists.map(related_artist => {
			return {body: related_artist.body, id: related_artist.requestUrl.split("/")[5]}
		})

		edges = related_artists.map(single_artist => {
			return single_artist.body.artists.map(x => {
				return { source: single_artist.id, target: x.id, type: x.genres.length > 0? x.genres[0]: 'Não informado' }
			})
		})

		edges = edges.reduce((arr, element) => {return arr.concat(element)}, [])

		fs.writeFile("nodes.json", JSON.stringify(nodes, null, 2))
		fs.writeFile("edges.json", JSON.stringify(edges, null, 2))
		fs.writeFile("ids.json", JSON.stringify(mapa_ids, null, 2))

		nodes = nodes.map(artist => {
			return {
				id: artist.id,
				name: artist.name,
				genres: artist.genres,
				img: artist.images[2].url,
				url: artist.external_urls.spotify
			}

		})
		links = edges.filter(link => mapa_ids.includes(link.target))

		fs.writeFile("links.json", JSON.stringify(links, null, 2))

		top50 = {nodes: nodes, edges: links}
		fs.writeFile("top50.json", JSON.stringify(top50, null, 2))
	})