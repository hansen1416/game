<script>
	import { Router, Route } from "svelte-routing";
	import Playground from "./routes/Playground.svelte";
</script>

<Router>
	<!-- <nav>
		<Link to="/">Home</Link>
		<Link to="/playground">Playground</Link>
		<Link to="/blog">Blog</Link>
	</nav> -->

	<!-- <Route path="/blog/:id" component={BlogPost} /> -->
	<Route path="/playground" component={Playground} />
</Router>
