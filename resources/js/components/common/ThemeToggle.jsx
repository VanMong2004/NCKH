import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            title="Đổi giao diện"
        >
            {theme === 'dark' ? (
                <Sun className="w-6 h-6 text-yellow-400 fill-yellow-400 transition-transform rotate-0" />
            ) : (
                <Moon className="w-6 h-6 text-gray-600 transition-transform rotate-0" />
            )}
        </button>
    );
};

export default ThemeToggle;
