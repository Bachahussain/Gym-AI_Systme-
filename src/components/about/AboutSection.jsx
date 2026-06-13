import React from 'react';

const AboutSection = () => {
    return (
        <div className="bg-purple-900 bg-opacity-60 backdrop-blur-lg border border-purple-700 shadow-lg rounded-xl w-full max-w-3xl mx-auto p-8">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold">🌟 About Us</h1>
                <p className="text-sm text-gray-300 mt-2">
                    Learn more about our journey, mission, and the values that drive us.
                </p>
            </div>

            {/* Content */}
            <div className="space-y-4 text-gray-200 text-sm leading-relaxed">
                <p>
                    At <span className="font-semibold text-white">FitApp</span>, we believe
                    fitness should be fun, empowering, and accessible to everyone. Our
                    mission is to provide athletes and beginners alike with the tools,
                    resources, and motivation they need to achieve their goals.
                </p>
                <p>
                    From personalized training splits to advanced progress analytics,
                    we are dedicated to helping you unlock your full potential — both
                    in the gym and beyond.
                </p>
            </div>

            {/* Highlights */}
            <div className="mt-6">
                <h2 className="text-lg font-bold mb-3">💡 What We Offer</h2>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    <li>Custom training programs tailored to you</li>
                    <li>Step-by-step exercise guides & demo videos</li>
                    <li>Nutrition tips and wellness guidance</li>
                    <li>Progress tracking with advanced analytics</li>
                    <li>A supportive community of athletes worldwide</li>
                </ul>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-gray-400 text-xs">
                <p>
                    Together, let’s make fitness a lifestyle. 💪
                </p>
            </div>
        </div>
    );
};

export default AboutSection;
