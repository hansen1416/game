<script>
	import { Router, Route } from "svelte-routing";
	import Ground from "./routes/Ground.svelte";
	import Terrain from "./routes/Terrain.svelte";
	import Boxing from "./routes/Boxing.svelte";
</script>

<Router>
	<!-- <Route path="/blog/:id" component={BlogPost} /> -->
	<Route path="/ground" component={Ground} />
	<Route path="/terrain" component={Terrain} />
	<Route path="/boxing" component={Boxing} />
</Router>
