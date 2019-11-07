import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getCanvasPosition } from './utils/formulas';
import Canvas from './components/Canvas';

// Auth0
import * as Auth0 from 'auth0-web';

// Socket.io
import io from 'socket.io-client';

Auth0.configure({
	domain: 'dev-rp1aph5p.auth0.com',
	clientID: 'hM0weSxRMpM66COZ6VI4ywdy1hm42mbo',
	redirectUri: 'http://localhost:3000/',
	responseType: 'token id_token',
	scope: 'openid profile manage:points',
	audience: 'https://cannons.com',
});

class App extends Component {
	componentDidMount() {
		const self = this;

		Auth0.handleAuthCallback();

		Auth0.subscribe((auth) => {
			if (!auth) return;

			const playerProfile = Auth0.getProfile();
			const currentPlayer = {
				id: playerProfile.sub,
				maxScore: 0,
				name: playerProfile.name,
				picture: playerProfile.picture,
			};

			this.props.loggedIn(currentPlayer);

			const socket = io('http://localhost:3001', {
				query: `token=${Auth0.getAccessToken()}`,
			});

			let emitted = false;
			socket.on('players', (players) => {
				this.props.leaderboardLoaded(players);

				if (emitted) return;
				socket.emit('new-max-score', {
					id: playerProfile.sub,
					maxScore: 120,
					name: playerProfile.name,
					picture: playerProfile.picture,
				});
				emitted = true;
				setTimeout(() => {
					socket.emit('new-max-score', {
						id: playerProfile.sub,
						maxScore: 222,
						name: playerProfile.name,
						picture: playerProfile.picture,
					});
				}, 5000);
			});
		});

		setInterval(() => {
			self.props.moveObjects(self.canvasMousePosition);
		}, 10);

		window.onresize = () => {
			const cnv = document.getElementById('aliens-go-home-canvas');
			cnv.style.width = `${window.innerWidth}px`;
			cnv.style.height = `${window.innerHeight}px`;
		};
		window.onresize();
	}

	trackMouse(event) {
		this.canvasMousePosition = getCanvasPosition(event);
	}

	render() {
		return (
			<Canvas
				angle={this.props.angle}
				currentPlayer={this.props.currentPlayer}
				gameState={this.props.gameState}
				players={this.props.players}
				startGame={this.props.startGame}
				trackMouse={event => (this.trackMouse(event))}
			/>
		);
	}
}

App.propTypes = {
	// ... other propTypes definitions
	currentPlayer: PropTypes.shape({
		id: PropTypes.string.isRequired,
		maxScore: PropTypes.number.isRequired,
		name: PropTypes.string.isRequired,
		picture: PropTypes.string.isRequired,
	}),
	leaderboardLoaded: PropTypes.func.isRequired,
	loggedIn: PropTypes.func.isRequired,
	players: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		maxScore: PropTypes.number.isRequired,
		name: PropTypes.string.isRequired,
		picture: PropTypes.string.isRequired,
	})),
};

App.defaultProps = {
	currentPlayer: null,
	players: null,
};

export default App;