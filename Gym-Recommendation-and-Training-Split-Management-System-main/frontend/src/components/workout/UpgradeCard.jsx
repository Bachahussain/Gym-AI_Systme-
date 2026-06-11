import React from 'react';
import Button from '../ui/Button';

const UpgradeCard = () => {
    return (
        <div className="bg-purple-800/40 rounded-2xl p-6 text-center">
            <p className="font-semibold mb-2">Unlock Pro Features</p>
            <p className="text-sm text-gray-300 mb-4">
                Get exercise videos, detailed instructions, and unlimited exercise variations
            </p>
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">Upgrade to Pro</Button>
        </div>
    );
};

export default UpgradeCard;
