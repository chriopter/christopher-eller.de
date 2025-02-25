export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.players = [
            { 
                x: 100, 
                y: 200, 
                color: '#FF5722', 
                score: 0,
                health: 100,
                direction: 0, // angle in degrees (0 = right, 90 = up, 180 = left, 270 = down)
                fov: 60 // field of view in degrees
            },
            { 
                x: this.width - 100, 
                y: 200, 
                color: '#2196F3', 
                score: 0,
                health: 100,
                direction: 180, // facing left
                fov: 60
            }
        ];
        this.currentPlayer = 0;  // 0 for player 1, 1 for player 2
        this.winner = null;
        this.walls = [];
        this.bullet = null;
        this.animationId = null;
        this.gameOver = false;
        
        // Callback for game updates
        this.onGameUpdate = null;
        
        // Generate map
        this.generateMap();
        
        // Initial render
        this.render();
    }
    
    generateMap() {
        // Create walls for the map
        this.walls = [
            // Outer walls
            { x: 0, y: 0, width: this.width, height: 20, color: '#555555' }, // Top
            { x: 0, y: this.height - 20, width: this.width, height: 20, color: '#555555' }, // Bottom
            { x: 0, y: 0, width: 20, height: this.height, color: '#555555' }, // Left
            { x: this.width - 20, y: 0, width: 20, height: this.height, color: '#555555' }, // Right
            
            // Inner walls
            { x: 100, y: 100, width: 200, height: 20, color: '#555555' },
            { x: 400, y: 150, width: 20, height: 150, color: '#555555' },
            { x: 200, y: 300, width: 150, height: 20, color: '#555555' },
            { x: 100, y: 250, width: 20, height: 100, color: '#555555' }
        ];
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw from the current player's perspective (first-person view)
        const player = this.players[this.currentPlayer];
        
        // Draw floor (gray)
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);
        
        // Draw ceiling (dark blue)
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height / 2);
        
        // Draw walls using raycasting
        this.drawWalls();
        
        // Draw other player if in view
        this.drawOtherPlayer();
        
        // Draw bullet if it exists
        if (this.bullet) {
            // In first-person view, we don't see the bullet directly
            // Instead, we might see a tracer effect or impact
            if (this.bullet.tracer) {
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(this.bullet.startX, this.bullet.startY);
                this.ctx.lineTo(this.bullet.x, this.bullet.y);
                this.ctx.stroke();
            }
        }
        
        // Draw crosshair
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        const crosshairSize = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2 - crosshairSize, this.height / 2);
        this.ctx.lineTo(this.width / 2 + crosshairSize, this.height / 2);
        this.ctx.moveTo(this.width / 2, this.height / 2 - crosshairSize);
        this.ctx.lineTo(this.width / 2, this.height / 2 + crosshairSize);
        this.ctx.stroke();
        
        // Draw HUD
        this.drawHUD();
    }
    
    drawWalls() {
        const player = this.players[this.currentPlayer];
        const fovRad = player.fov * Math.PI / 180;
        const rayCount = this.width;
        const rayAngleStep = fovRad / rayCount;
        
        // Start angle is player direction minus half of FOV
        const startAngle = (player.direction - player.fov / 2) * Math.PI / 180;
        
        for (let i = 0; i < rayCount; i++) {
            const rayAngle = startAngle + i * rayAngleStep;
            const ray = {
                x: player.x,
                y: player.y,
                dx: Math.cos(rayAngle),
                dy: Math.sin(rayAngle)
            };
            
            // Find closest wall intersection
            let minDist = Infinity;
            let wallColor = null;
            
            for (const wall of this.walls) {
                // Check each edge of the wall
                const edges = [
                    { x1: wall.x, y1: wall.y, x2: wall.x + wall.width, y2: wall.y }, // Top
                    { x1: wall.x, y1: wall.y + wall.height, x2: wall.x + wall.width, y2: wall.y + wall.height }, // Bottom
                    { x1: wall.x, y1: wall.y, x2: wall.x, y2: wall.y + wall.height }, // Left
                    { x1: wall.x + wall.width, y1: wall.y, x2: wall.x + wall.width, y2: wall.y + wall.height } // Right
                ];
                
                for (const edge of edges) {
                    // Line-line intersection
                    const x1 = ray.x;
                    const y1 = ray.y;
                    const x2 = ray.x + ray.dx * 1000; // Far point
                    const y2 = ray.y + ray.dy * 1000;
                    
                    const x3 = edge.x1;
                    const y3 = edge.y1;
                    const x4 = edge.x2;
                    const y4 = edge.y2;
                    
                    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                    if (den === 0) continue; // Parallel lines
                    
                    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
                    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
                    
                    if (t > 0 && u >= 0 && u <= 1) {
                        const intersectX = x1 + t * (x2 - x1);
                        const intersectY = y1 + t * (y2 - y1);
                        
                        const dist = Math.sqrt(
                            (intersectX - ray.x) * (intersectX - ray.x) +
                            (intersectY - ray.y) * (intersectY - ray.y)
                        );
                        
                        if (dist < minDist) {
                            minDist = dist;
                            wallColor = wall.color;
                        }
                    }
                }
            }
            
            if (minDist < Infinity) {
                // Calculate wall height based on distance (perspective correction)
                const correctDist = minDist * Math.cos(rayAngle - player.direction * Math.PI / 180);
                const wallHeight = Math.min(this.height, (this.height * 0.5) / correctDist * 300);
                
                // Darken walls based on distance
                const brightness = Math.max(0.3, 1 - minDist / 500);
                const color = this.adjustBrightness(wallColor, brightness);
                
                // Draw wall strip
                this.ctx.fillStyle = color;
                this.ctx.fillRect(
                    i, 
                    this.height / 2 - wallHeight / 2, 
                    1, 
                    wallHeight
                );
            }
        }
    }
    
    adjustBrightness(hexColor, factor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // Adjust brightness
        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);
        
        // Convert back to hex
        return `rgb(${newR}, ${newG}, ${newB})`;
    }
    
    drawOtherPlayer() {
        const currentPlayer = this.players[this.currentPlayer];
        const otherPlayer = this.players[1 - this.currentPlayer];
        
        // Calculate angle to other player
        const dx = otherPlayer.x - currentPlayer.x;
        const dy = otherPlayer.y - currentPlayer.y;
        const angleToPlayer = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Check if other player is in field of view
        let angleDiff = (angleToPlayer - currentPlayer.direction) % 360;
        if (angleDiff < -180) angleDiff += 360;
        if (angleDiff > 180) angleDiff -= 360;
        
        if (Math.abs(angleDiff) <= currentPlayer.fov / 2) {
            // Calculate distance to other player
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if there's a wall between players
            if (!this.isWallBetween(currentPlayer, otherPlayer)) {
                // Calculate screen position
                const screenX = this.width / 2 + (angleDiff / (currentPlayer.fov / 2)) * (this.width / 2);
                
                // Calculate size based on distance
                const size = Math.min(100, 2000 / distance);
                
                // Draw other player
                this.ctx.fillStyle = otherPlayer.color;
                this.ctx.beginPath();
                this.ctx.arc(screenX, this.height / 2, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    isWallBetween(player1, player2) {
        // Check if there's a wall between two points
        const dx = player2.x - player1.x;
        const dy = player2.y - player1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Check multiple points along the line
        const steps = 10;
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = player1.x + dirX * distance * t;
            const y = player1.y + dirY * distance * t;
            
            // Check if point is inside any wall
            for (const wall of this.walls) {
                if (x >= wall.x && x <= wall.x + wall.width &&
                    y >= wall.y && y <= wall.y + wall.height) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    drawHUD() {
        const player = this.players[this.currentPlayer];
        const opponent = this.players[1 - this.currentPlayer];
        
        // Draw health bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(20, this.height - 60, 200, 40);
        
        this.ctx.fillStyle = player.health > 30 ? '#4CAF50' : '#F44336';
        this.ctx.fillRect(25, this.height - 55, player.health * 1.9, 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Health: ${player.health}`, 30, this.height - 35);
        
        // Draw scores
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${player.score}`, 20, 30);
        
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Opponent: ${opponent.score}`, this.width - 20, 30);
        
        // Draw current player indicator
        this.ctx.fillStyle = player.color;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Your Turn', this.width / 2, 30);
    }
    
    shootBullet(angle, power) {
        if (this.bullet || this.gameOver) return false;
        
        const player = this.players[this.currentPlayer];
        // Adjust angle based on player's direction
        const shootAngle = (player.direction + angle) * Math.PI / 180;
        
        this.bullet = {
            x: player.x,
            y: player.y,
            startX: player.x,
            startY: player.y,
            dx: Math.cos(shootAngle) * (power / 10),
            dy: Math.sin(shootAngle) * (power / 10),
            tracer: true,
            frames: 0
        };
        
        this.animateBullet();
        
        if (this.onGameUpdate) {
            this.onGameUpdate({
                currentPlayer: this.currentPlayer,
                angle: angle,
                power: power
            });
        }
        
        return true;
    }
    
    animateBullet() {
        if (!this.bullet) return;
        
        // Update bullet position
        this.bullet.x += this.bullet.dx;
        this.bullet.y += this.bullet.dy;
        this.bullet.frames++;
        
        // After a few frames, remove the tracer effect
        if (this.bullet.frames > 5) {
            this.bullet.tracer = false;
        }
        
        // Check for collision with walls
        for (const wall of this.walls) {
            if (this.bullet.x >= wall.x && 
                this.bullet.x <= wall.x + wall.width &&
                this.bullet.y >= wall.y && 
                this.bullet.y <= wall.y + wall.height) {
                // Bullet hit a wall
                this.bullet = null;
                this.switchPlayer();
                return;
            }
        }
        
        // Check for collision with players
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const dx = this.bullet.x - player.x;
            const dy = this.bullet.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                // Bullet hit a player
                if (i !== this.currentPlayer) {
                    // Hit opponent
                    this.players[i].health -= 25; // Reduce health
                    
                    if (this.players[i].health <= 0) {
                        this.players[this.currentPlayer].score++;
                        this.players[i].health = 100; // Reset health for next round
                        
                        if (this.players[this.currentPlayer].score >= 3) {
                            this.winner = this.currentPlayer;
                            this.gameOver = true;
                        }
                    }
                }
                
                this.bullet = null;
                this.switchPlayer();
                return;
            }
        }
        
        // Check if bullet is out of bounds
        if (this.bullet.x < 0 || this.bullet.x > this.width || 
            this.bullet.y < 0 || this.bullet.y > this.height) {
            this.bullet = null;
            this.switchPlayer();
            return;
        }
        
        // Render the updated state
        this.render();
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animateBullet());
    }
    
    switchPlayer() {
        cancelAnimationFrame(this.animationId);
        this.currentPlayer = 1 - this.currentPlayer;
        
        if (this.onGameUpdate) {
            this.onGameUpdate({
                currentPlayer: this.currentPlayer,
                winner: this.winner,
                gameOver: this.gameOver
            });
        }
        
        this.render();
    }
    
    // Move the current player
    movePlayer(direction) {
        if (this.bullet || this.gameOver) return false;
        
        const player = this.players[this.currentPlayer];
        const moveSpeed = 10;
        
        let newX = player.x;
        let newY = player.y;
        
        // Calculate movement based on player's direction
        const moveAngle = player.direction * Math.PI / 180;
        
        if (direction === 'forward') {
            newX += Math.cos(moveAngle) * moveSpeed;
            newY += Math.sin(moveAngle) * moveSpeed;
        } else if (direction === 'backward') {
            newX -= Math.cos(moveAngle) * moveSpeed;
            newY -= Math.sin(moveAngle) * moveSpeed;
        } else if (direction === 'left') {
            // Strafe left (perpendicular to direction)
            newX += Math.cos(moveAngle - Math.PI/2) * moveSpeed;
            newY += Math.sin(moveAngle - Math.PI/2) * moveSpeed;
        } else if (direction === 'right') {
            // Strafe right (perpendicular to direction)
            newX += Math.cos(moveAngle + Math.PI/2) * moveSpeed;
            newY += Math.sin(moveAngle + Math.PI/2) * moveSpeed;
        }
        
        // Check for collision with walls
        let collision = false;
        for (const wall of this.walls) {
            if (newX >= wall.x - 20 && newX <= wall.x + wall.width + 20 &&
                newY >= wall.y - 20 && newY <= wall.y + wall.height + 20) {
                collision = true;
                break;
            }
        }
        
        // Update position if no collision
        if (!collision) {
            player.x = newX;
            player.y = newY;
            this.render();
        }
        
        return true;
    }
    
    // Rotate the current player
    rotatePlayer(angle) {
        if (this.bullet || this.gameOver) return false;
        
        const player = this.players[this.currentPlayer];
        player.direction = (player.direction + angle) % 360;
        if (player.direction < 0) player.direction += 360;
        
        this.render();
        return true;
    }
    
    reset() {
        cancelAnimationFrame(this.animationId);
        this.players = [
            { 
                x: 100, 
                y: 200, 
                color: '#FF5722', 
                score: 0,
                health: 100,
                direction: 0,
                fov: 60
            },
            { 
                x: this.width - 100, 
                y: 200, 
                color: '#2196F3', 
                score: 0,
                health: 100,
                direction: 180,
                fov: 60
            }
        ];
        this.currentPlayer = 0;
        this.winner = null;
        this.bullet = null;
        this.gameOver = false;
        
        // Generate new map
        this.generateMap();
        
        if (this.onGameUpdate) {
            this.onGameUpdate({
                currentPlayer: this.currentPlayer,
                winner: null,
                gameOver: false
            });
        }
        
        this.render();
    }
    
    receiveThrow(angle, power) {
        return this.shootBullet(angle, power);
    }
}
