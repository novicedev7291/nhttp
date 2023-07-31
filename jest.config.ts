import type { Config } from 'jest';

const config: Config = {
    verbose: true,
    moduleDirectories: ['node_modules', 'src'],
    transform: {
        "\\.[jt]sx?$": "ts-jest"
    }
}

export default config;
