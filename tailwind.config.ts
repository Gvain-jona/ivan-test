import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', 'class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Add any classes that might be used dynamically
    'bg-orange-500',
    'text-orange-500',
    'border-orange-500',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			brand: {
  				DEFAULT: 'hsl(var(--primary))',
  				muted: 'hsl(var(--primary) / 0.4)'
  			},
  			chart: {
  				line: 'hsl(var(--primary))',
  				point: 'hsl(var(--primary))',
  				grid: 'hsl(var(--muted) / 0.2)'
  			},
  			table: {
  				border: 'hsl(var(--border))',
  				hover: 'hsl(var(--muted) / 0.1)',
  				header: 'hsl(var(--muted-foreground))',
  				secondaryText: 'hsl(var(--muted-foreground) / 0.8)'
  			},
  			status: {
  				pending: 'hsl(var(--status-pending))',
  				in_progress: 'hsl(var(--status-in-progress))',
  				paused: 'hsl(var(--status-paused))',
  				completed: 'hsl(var(--status-completed))',
  				delivered: 'hsl(var(--status-delivered))',
  				cancelled: 'hsl(var(--status-cancelled))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			subtle: '0 2px 8px 0 rgba(0, 0, 0, 0.2)',
  			card: '0 4px 12px rgba(0, 0, 0, 0.25)',
  			toast: '0px 32px 64px -16px rgba(0,0,0,0.30), 0px 16px 32px -8px rgba(0,0,0,0.30), 0px 8px 16px -4px rgba(0,0,0,0.24), 0px 4px 8px -2px rgba(0,0,0,0.24), 0px -8px 16px -1px rgba(0,0,0,0.16), 0px 2px 4px -1px rgba(0,0,0,0.24), 0px 0px 0px 1px rgba(0,0,0,1.00), inset 0px 0px 0px 1px rgba(255,255,255,0.08), inset 0px 1px 0px 0px rgba(255,255,255,0.20)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'slide-in-from-top-full': {
  				from: {
  					transform: 'translateY(-100%)'
  				},
  				to: {
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-from-bottom-full': {
  				from: {
  					transform: 'translateY(100%)'
  				},
  				to: {
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-out-to-right-full': {
  				from: {
  					transform: 'translateX(0)'
  				},
  				to: {
  					transform: 'translateX(100%)'
  				}
  			},
  			'fade-out-80': {
  				from: {
  					opacity: '1'
  				},
  				to: {
  					opacity: '0.2'
  				}
  			},
        'pulse-slow': {
          '0%, 100%': {
            opacity: '1'
          },
          '50%': {
            opacity: '0.8'
          }
        },
        'pulse-attention': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1',
            boxShadow: '0 0 0 0 rgba(0, 0, 0, 0.1)'
          },
          '50%': {
            transform: 'scale(1.02)',
            opacity: '0.95',
            boxShadow: '0 0 0 4px rgba(0, 0, 0, 0.05)'
          }
        }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'in': 'slide-in-from-top-full 0.3s ease-out',
  			'out': 'slide-out-to-right-full 0.3s ease-out, fade-out-80 0.3s ease-out',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-attention': 'pulse-attention 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  		}
  	}
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;