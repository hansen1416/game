<script>
	import { Router, Route } from "svelte-routing";
	import Ground from "./routes/Ground.svelte";
	import Terrain from "./routes/Terrain.svelte";
</script>

<Router>
	<!-- <nav>
		<Link to="/">Home</Link>
		<Link to="/playground">Playground</Link>
		<Link to="/blog">Blog</Link>
	</nav> -->

	<!-- <Route path="/blog/:id" component={BlogPost} /> -->
	<Route path="/ground" component={Ground} />
	<Route path="/terrain" component={Terrain} />
</Router>
